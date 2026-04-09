const { logCallSummary } = require('../services/conversationService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

async function handleLogCallSummary(req, res) {
  try {
    const { call_id, phone, summary, organization_id, duration_seconds } = req.body;

    if (!summary) return errorResponse(res, 'Field "summary" is required.');

    const result = await logCallSummary({ call_id, phone, summary, organization_id, duration_seconds });
    return successResponse(res, result, 201);
  } catch (error) {
    console.error('[logCallSummary] Error:', error.message);
    return errorResponse(res, error.message);
  }
}

async function handleHandoffToHuman(req, res) {
  try {
    const { phone, reason, call_id } = req.body;

    // Log the handoff request — no external action needed for now
    console.log(`[handoff-to-human] Call ID: ${call_id || 'N/A'} | Phone: ${phone || 'N/A'} | Reason: ${reason || 'Not specified'}`);

    return res.status(200).json({
      success: true,
      handoff: true,
      message: 'Handoff to human agent initiated.',
      call_id: call_id || null,
      phone: phone || null,
      reason: reason || null,
    });
  } catch (error) {
    console.error('[handoffToHuman] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { handleLogCallSummary, handleHandoffToHuman };