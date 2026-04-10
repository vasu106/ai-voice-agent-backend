/**
 * Vapi sends tool arguments nested inside message.toolCalls[0].function.arguments
 * This utility extracts and parses them into a flat object.
 * Falls back to req.body directly if called from Postman/direct API.
 */
function parseVapiBody(body) {
  try {
    // Check if this is a Vapi webhook format
    if (body?.message?.toolCalls?.length > 0) {
      const toolCall = body.message.toolCalls[0];
      const args = toolCall?.function?.arguments;

      if (typeof args === 'string') {
        return JSON.parse(args);
      }

      if (typeof args === 'object') {
        return args;
      }
    }

    // Direct API call (Postman / testing) — return body as-is
    return body;
  } catch (err) {
    console.error('[vapiParser] Failed to parse body:', err.message);
    return body;
  }
}

module.exports = { parseVapiBody };