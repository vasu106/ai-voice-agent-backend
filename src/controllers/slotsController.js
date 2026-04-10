const { getAvailableSlots } = require('../services/slotsService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { parseVapiBody } = require('../utils/vapiParser');

async function handleGetAvailableSlots(req, res) {
  try {
    const data = parseVapiBody(req.body);
    const { date, doctor } = data;

    if (!date) return errorResponse(res, 'Field "date" is required.');
    if (!doctor) return errorResponse(res, 'Field "doctor" is required.');

    const result = await getAvailableSlots(date, doctor);
    return successResponse(res, result);
  } catch (error) {
    console.error('[getAvailableSlots] Error:', error.message);
    return errorResponse(res, error.message);
  }
}

module.exports = { handleGetAvailableSlots };