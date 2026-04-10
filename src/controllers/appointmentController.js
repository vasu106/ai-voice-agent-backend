const {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} = require('../services/appointmentService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { parseVapiBody } = require('../utils/vapiParser');

async function handleBookAppointment(req, res) {
  try {
    const data = parseVapiBody(req.body);
    const { patient_name, phone, doctor, date, time } = data;

    if (!patient_name) return errorResponse(res, 'Field "patient_name" is required.');
    if (!phone) return errorResponse(res, 'Field "phone" is required.');
    if (!doctor) return errorResponse(res, 'Field "doctor" is required.');
    if (!date) return errorResponse(res, 'Field "date" is required.');
    if (!time) return errorResponse(res, 'Field "time" is required.');

    const result = await bookAppointment({ patient_name, phone, doctor, date, time });
    return successResponse(res, { message: 'Appointment booked successfully.', appointment: result }, 201);
  } catch (error) {
    console.error('[bookAppointment] Error:', error.message);
    return errorResponse(res, error.message);
  }
}

async function handleCancelAppointment(req, res) {
  try {
    const data = parseVapiBody(req.body);
    const { phone, date } = data;

    if (!phone) return errorResponse(res, 'Field "phone" is required.');
    if (!date) return errorResponse(res, 'Field "date" is required.');

    const result = await cancelAppointment(phone, date);
    return successResponse(res, result);
  } catch (error) {
    console.error('[cancelAppointment] Error:', error.message);
    return errorResponse(res, error.message);
  }
}

async function handleRescheduleAppointment(req, res) {
  try {
    const data = parseVapiBody(req.body);
    const { phone, old_date, new_date, new_time, doctor } = data;

    if (!phone) return errorResponse(res, 'Field "phone" is required.');
    if (!old_date) return errorResponse(res, 'Field "old_date" is required.');
    if (!new_date) return errorResponse(res, 'Field "new_date" is required.');
    if (!new_time) return errorResponse(res, 'Field "new_time" is required.');
    if (!doctor) return errorResponse(res, 'Field "doctor" is required.');

    const result = await rescheduleAppointment({ phone, old_date, new_date, new_time, doctor });
    return successResponse(res, result);
  } catch (error) {
    console.error('[rescheduleAppointment] Error:', error.message);
    return errorResponse(res, error.message);
  }
}

module.exports = {
  handleBookAppointment,
  handleCancelAppointment,
  handleRescheduleAppointment,
};