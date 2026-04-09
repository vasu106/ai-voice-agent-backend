const express = require('express');
const router = express.Router();

const { handleGetAvailableSlots } = require('../controllers/slotsController');
const {
  handleBookAppointment,
  handleCancelAppointment,
  handleRescheduleAppointment,
} = require('../controllers/appointmentController');
const { handleLogCallSummary, handleHandoffToHuman } = require('../controllers/conversationController');

// Slots
router.post('/get-available-slots', handleGetAvailableSlots);

// Appointments
router.post('/book-appointment', handleBookAppointment);
router.post('/cancel-appointment', handleCancelAppointment);
router.post('/reschedule-appointment', handleRescheduleAppointment);

// Conversations
router.post('/log-call-summary', handleLogCallSummary);
router.post('/handoff-to-human', handleHandoffToHuman);

module.exports = router;