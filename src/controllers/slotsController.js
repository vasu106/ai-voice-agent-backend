const { getAvailableSlots } = require('../services/slotsService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

async function handleGetAvailableSlots(req, res) {
  try {
    const { date, doctor } = req.body;

    if (!date) {
      return errorResponse(res, 'Field "date" is required.');
    }

    if (!doctor) {
      return errorResponse(res, 'Field "doctor" is required.');
    }

    const result = await getAvailableSlots(date, doctor);
    return successResponse(res, result);
  } catch (error) {
    console.error('[getAvailableSlots] Error:', error.message);
    return errorResponse(res, error.message);
  }
}

module.exports = { handleGetAvailableSlots };