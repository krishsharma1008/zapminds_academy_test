import { runPythonTests } from "~/server/utils/python-runner";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    language?: string;
    code?: string;
    tests?: any[];
  }>(event);

  if (!body?.code || typeof body.code !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Code payload is required.",
    });
  }

  if (!Array.isArray(body.tests) || body.tests.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No tests were provided.",
    });
  }

  const language = (body.language ?? "python").toLowerCase();
  if (language !== "python") {
    throw createError({
      statusCode: 400,
      statusMessage: "Only Python exercises are supported right now.",
    });
  }

  const results = await runPythonTests(body.code, body.tests);

  return {
    results,
  };
});
