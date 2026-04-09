const {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} = require('../services/appointmentService');

const { successResponse, errorResponse } = require('../utils/responseHelper');

// BOOK
async function handleBookAppointment(req, res) {
  try {
    const { patient_name, phone, doctor, date, time } = req.body;

    if (!patient_name) return errorResponse(res, 'patient_name required');
    if (!phone) return errorResponse(res, 'phone required');
    if (!doctor) return errorResponse(res, 'doctor required');
    if (!date) return errorResponse(res, 'date required');
    if (!time) return errorResponse(res, 'time required');

    const result = await bookAppointment({
      patient_name,
      phone,
      doctor,
      date,
      time,
    });

    return successResponse(res, result, 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
}

// CANCEL
async function handleCancelAppointment(req, res) {
  try {
    const { phone, booking_code } = req.body;

      if (!booking_code) return errorResponse(res, 'booking_code required');
      if (!phone) return errorResponse(res, 'phone required');

    const result = await cancelAppointment({ phone, booking_code });
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message);
  }
}

// RESCHEDULE
async function handleRescheduleAppointment(req, res) {
  try {
    const result = await rescheduleAppointment(req.body);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message);
  }
}

module.exports = {
  handleBookAppointment,
  handleCancelAppointment,
  handleRescheduleAppointment,
};