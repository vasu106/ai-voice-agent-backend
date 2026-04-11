/**
 * Vapi sends tool arguments nested inside message.toolCalls[0].function.arguments
 * This utility extracts and parses them into a flat object.
 * Also extracts phone number from Vapi's call object automatically.
 * Falls back to req.body directly if called from Postman/direct API.
 */
function parseVapiBody(body) {
  try {
    // Check if this is a Vapi webhook format
    if (body?.message?.toolCalls?.length > 0) {
      const toolCall = body.message.toolCalls[0];
      const args = toolCall?.function?.arguments;

      let parsed = {};

      if (typeof args === 'string') {
        parsed = JSON.parse(args);
      } else if (typeof args === 'object') {
        parsed = { ...args };
      }

      // Auto-inject phone from Vapi call object if not already in args
      // Vapi provides caller phone in: body.call.customer.number
      if (!parsed.phone) {
        const vapiPhone =
          body?.call?.customer?.number ||
          body?.message?.call?.customer?.number ||
          body?.call?.phoneNumber?.number ||
          null;
        if (vapiPhone) {
          parsed.phone = vapiPhone;
        }
      }

      return parsed;
    }

    // Direct API call (Postman / testing) — return body as-is
    return body;
  } catch (err) {
    console.error('[vapiParser] Failed to parse body:', err.message);
    return body;
  }
}

module.exports = { parseVapiBody };