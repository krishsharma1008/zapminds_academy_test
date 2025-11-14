import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PYTHON_TIMEOUT = 8000;

export type PlaygroundTestPayload = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type PlaygroundTestResult = {
  id: string;
  status: "passed" | "failed";
  output: string;
};

const escapeForPython = (value: string) => JSON.stringify(value);

const DOUBLE_SMART_QUOTES = /[\u201C\u201D\u201E\u201F\u2033\u2036]/g;
const SINGLE_SMART_QUOTES = /[\u2018\u2019\u201A\u201B\u2032\u2035]/g;
const NON_BREAKING_SPACES = /\u00A0/g;

const normalizeInput = (value: string) =>
  value
    .replace(DOUBLE_SMART_QUOTES, '"')
    .replace(SINGLE_SMART_QUOTES, "'")
    .replace(NON_BREAKING_SPACES, " ");

const buildScript = (code: string, assertion: string) => {
  const sanitizedCode = normalizeInput(code);
  const sanitizedAssertion = normalizeInput(assertion);
  const captureReady = sanitizedAssertion.replace(
    /(?<!def )__test__\(\)/g,
    "__zapminds_capture(__test__())"
  );

  return `
import json
import traceback
import contextlib
import io
import sys

code = ${escapeForPython(sanitizedCode)}
test_code = ${escapeForPython(captureReady)}

globals_dict = {"__builtins__": __builtins__}

try:
    compiled_code = compile(code, "<playground>", "exec")
    exec(compiled_code, globals_dict, globals_dict)
except SyntaxError as exc:
    print(
        json.dumps(
            {
                "syntax_error": {
                    "message": exc.msg,
                    "line": exc.lineno,
                    "offset": exc.offset,
                    "text": exc.text,
                }
            }
        )
    )
    sys.exit(0)

__zapminds_result = None

def __zapminds_capture(value):
    global __zapminds_result
    __zapminds_result = value
    return value

globals_dict["__zapminds_capture"] = __zapminds_capture

try:
    _buffer = io.StringIO()
    with contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):
        exec(test_code, globals_dict, globals_dict)
        if __zapminds_result is None and "__test__" in globals_dict:
            __zapminds_result = __zapminds_capture(globals_dict["__test__"]())
    print(json.dumps({"result": __zapminds_result, "stdout": _buffer.getvalue()}, default=str))
except Exception:
    print(json.dumps({"error": traceback.format_exc()}))
`.trim();
};

const formatSyntaxError = (details: any) => {
  if (!details) {
    return "SyntaxError: invalid syntax";
  }

  const line = typeof details.line === "number" ? details.line : undefined;
  const offset =
    typeof details.offset === "number" ? details.offset : undefined;
  const message = details.message ?? "invalid syntax";
  const text =
    typeof details.text === "string" ? details.text.replace(/\s+$/, "") : "";
  const pointer =
    typeof offset === "number" && offset > 0
      ? `${" ".repeat(Math.max(offset - 1, 0))}^`
      : "";

  let formatted = `SyntaxError${line ? ` on line ${line}` : ""}${
    offset ? `, column ${offset}` : ""
  }: ${message}`;
  if (text) {
    formatted += `\n${text}`;
    if (pointer) {
      formatted += `\n${pointer}`;
    }
  }

  return formatted;
};

export const runPythonTests = async (
  code: string,
  tests: PlaygroundTestPayload[]
): Promise<PlaygroundTestResult[]> => {
  const execution: PlaygroundTestResult[] = [];

  for (const test of tests) {
    const script = buildScript(code, test.assertion);

    try {
      // const { stdout } = await execFileAsync("python3", ["-c", script], {
      //   timeout: PYTHON_TIMEOUT,
      //   maxBuffer: 1024 * 1024,
      // });

      // Pick interpreter dynamically
      const pythonCmd = process.platform === "win32" ? "python" : "python3";

      const { stdout } = await execFileAsync(pythonCmd, ["-c", script], {
        timeout: PYTHON_TIMEOUT,
        maxBuffer: 1024 * 1024,
      });

      const payloadLine = stdout.trim().split("\n").filter(Boolean).pop();
      const payload = payloadLine ? JSON.parse(payloadLine) : {};
      const hasSyntaxError = Boolean(payload.syntax_error);
      const hasError = Boolean(payload.error) || hasSyntaxError;
      const rawResult = payload.result;
      const capturedStdout =
        typeof payload.stdout === "string" ? payload.stdout.trim() : "";
      let status: "passed" | "failed" = "failed";

      if (!hasError) {
        if (typeof test.expected === "string") {
          const expected = String(test.expected).trim();
          const expectedLower = expected.toLowerCase();
          const actualString = (rawResult ?? "").toString().trim();
          const actualLower = actualString.toLowerCase();

          const isBooleanExpectation =
            expectedLower === "true" || expectedLower === "false";

          const matches = isBooleanExpectation
            ? actualLower === expectedLower
            : actualString === expected;
          status = matches ? "passed" : "failed";
        } else {
          status =
            rawResult === true ||
            String(rawResult).toLowerCase() === "true" ||
            rawResult === "SUCCESS"
              ? "passed"
              : "failed";
        }
      }

      execution.push({
        id: test.id,
        status: hasError ? "failed" : status,
        output: hasError
          ? hasSyntaxError
            ? formatSyntaxError(payload.syntax_error)
            : payload.error
          : capturedStdout ||
            (rawResult !== undefined ? String(rawResult) : "Success"),
      });
    } catch (error: any) {
      const message =
        error?.stderr || error?.stdout || error?.message || "Execution failed.";
      execution.push({
        id: test.id,
        status: "failed",
        output: message,
      });
    }
  }

  return execution;
};
