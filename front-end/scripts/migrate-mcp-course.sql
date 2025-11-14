-- MCP Module Details Migration
-- This migrates all MCP course data from TypeScript to Supabase

-- Get the module IDs that were just inserted (assuming auto-increment)
-- We'll use subqueries to get the right IDs

INSERT INTO module_details (module_id, course_id, external_id, duration, difficulty, overview, learning_objectives, reading, code_concepts, exercise)
SELECT 
  m.id,
  10,
  'mcp-handshake',
  '15 min',
  'core',
  'Craft MCP handshake payloads that advertise client identity, supported protocol versions, and requested capabilities before any tool calls are made.',
  '["Validate capability entries for required fields", "Attach protocol version and client metadata consistently", "Surface clear errors when payloads are malformed"]'::jsonb,
  '[{"label": "MCP Specification – Handshake", "url": "https://modelcontextprotocol.io/spec/latest"}]'::jsonb,
  '{"dict composition", "validation", "list comprehension"}',
  '{
    "id": "exercise-build-handshake",
    "title": "Build MCP Handshake",
    "prompt": "Implement build_handshake(client_name, capabilities) returning a dict with protocol_version, client, and capabilities. Each capability must include name and version. Raise ValueError when invalid.",
    "starterCode": "from typing import Dict, Iterable, List\n\n\ndef build_handshake(client_name: str, capabilities: Iterable[Dict[str, str]]) -> Dict[str, object]:\n    \"\"\"Return a valid MCP handshake payload.\"\"\"\n    # TODO: validate capability entries and compose handshake dict\n    ...",
    "hints": [
      "protocol_version should be fixed to '\''1.0'\''.",
      "client metadata can be {\"name\": client_name}.",
      "Ensure every capability has non-empty name/version strings."
    ],
    "tests": [
      {
        "id": "handshake",
        "description": "Includes required fields with cleaned capabilities.",
        "assertion": "\ndef __test__():\n    payload = build_handshake(\"zapminds-shell\", [{\"name\": \"fs/read\", \"version\": \"1\"}])\n    return payload[\"protocol_version\"] == \"1.0\" and payload[\"client\"][\"name\"] == \"zapminds-shell\" and payload[\"capabilities\"][0][\"name\"] == \"fs/read\"\n__test__()\n",
        "expected": "True"
      },
      {
        "id": "invalid",
        "description": "Raises error for malformed capability.",
        "assertion": "\ndef __test__():\n    try:\n        build_handshake(\"client\", [{\"name\": \"\", \"version\": \"1\"}])\n    except ValueError:\n        return True\n    return False\n__test__()\n",
        "expected": "True"
      }
    ]
  }'::jsonb
FROM modules m
WHERE m.course_id = 10 AND m.order_index = 1
LIMIT 1;

INSERT INTO module_details (module_id, course_id, external_id, duration, difficulty, overview, learning_objectives, reading, code_concepts, exercise)
SELECT 
  m.id,
  10,
  'mcp-negotiation',
  '16 min',
  'core',
  'Match client intents with provider features while respecting minimum versions and fallbacks.',
  '["Intersect client-requested capabilities with provider support", "Respect minimum version requirements", "Return structured matches ordered by priority"]'::jsonb,
  '[{"label": "Negotiating Capabilities", "url": "https://modelcontextprotocol.io/spec/latest#capabilities"}]'::jsonb,
  '{"sets", "sorting", "tuples"}',
  '{
    "id": "exercise-negotiate",
    "title": "Match Capabilities",
    "prompt": "Implement negotiate_capabilities(provider, requested) returning a list of tuples (name, version). provider is dict name->supported versions list. requested contains dicts with name, min_version, and priority.",
    "starterCode": "from typing import Dict, Iterable, List, Tuple\n\n\ndef negotiate_capabilities(provider: Dict[str, List[str]], requested: Iterable[Dict[str, object]]) -> List[Tuple[str, str]]:\n    \"\"\"Return capabilities that satisfy requested minima ordered by priority.\"\"\"\n    # TODO: filter supported versions and sort by priority ascending\n    ...",
    "hints": [
      "Priority 0 is highest; sort ascending.",
      "Pick the highest provider version >= min_version.",
      "Skip capabilities the provider does not expose."
    ],
    "tests": [
      {
        "id": "negotiates",
        "description": "Chooses compatible versions and orders by priority.",
        "assertion": "\ndef __test__():\n    provider = {\"search\": [\"1.0\", \"1.1\"], \"fs/read\": [\"1.0\"]}\n    requested = [\n        {\"name\": \"fs/read\", \"min_version\": \"1.0\", \"priority\": 1},\n        {\"name\": \"search\", \"min_version\": \"1.1\", \"priority\": 0},\n    ]\n    result = negotiate_capabilities(provider, requested)\n    return result == [(\"search\", \"1.1\"), (\"fs/read\", \"1.0\")]\n__test__()\n",
        "expected": "True"
      }
    ]
  }'::jsonb
FROM modules m
WHERE m.course_id = 10 AND m.order_index = 2
LIMIT 1;

-- Continue for remaining modules...
-- Due to SQL size, we'll insert the rest via TypeScript script instead

