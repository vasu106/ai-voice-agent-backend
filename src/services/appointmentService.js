const supabase = require('../config/supabase');
const { normalizeDate, getDayName, isWithinWorkingHours } = require('../utils/slotHelper');

// ─── Booking Code Generator ───────────────────────────────────────────────────
function generateBookingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Find or Create Patient ───────────────────────────────────────────────────
async function findOrCreatePatient(name, phone, organizationId) {
  const { data: existingPatient } = await supabase
    .from('patients')
    .select('*')
    .eq('phone', phone)
    .eq('organization_id', organizationId)
    .limit(1)
    .single();

  if (existingPatient) return existingPatient;

  const { data: newPatient, error } = await supabase
    .from('patients')
    .insert({
      name,
      phone,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error || !newPatient) {
    console.error('[findOrCreatePatient] Error:', error);
    throw new Error('Failed to create patient.');
  }

  return newPatient;
}

// ─── Validate Doctor ──────────────────────────────────────────────────────────
async function validateDoctor(doctor) {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, name, organization_id')
    .ilike('name', `%${doctor}%`)
    .limit(1)
    .single();

  if (error || !data) {
    console.error('[validateDoctor] Error:', error);
    throw new Error(`Doctor "${doctor}" not found.`);
  }

  return data;
}

// ─── Validate Clinic Hours ────────────────────────────────────────────────────
async function validateClinicHours(orgId, date, time) {
  const dayName = getDayName(date);

  const { data, error } = await supabase
    .from('clinic_hours')
    .select('open_time, close_time, is_open')
    .eq('organization_id', orgId)
    .eq('day_of_week', dayName);

  if (error || !data || data.length === 0) {
    throw new Error(`No clinic hours found for ${dayName}.`);
  }

  const openSlots = data.filter((d) => d.is_open);

  if (openSlots.length === 0) {
    throw new Error(`Clinic is closed on ${dayName}.`);
  }

  let valid = false;
  for (const slot of openSlots) {
    if (isWithinWorkingHours(time, slot.open_time, slot.close_time)) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    throw new Error(`Time ${time} is outside working hours.`);
  }
}

// ─── Check Slot Availability ──────────────────────────────────────────────────
async function isSlotBooked(doctorId, date, time) {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .eq('appointment_time', time)
    .in('status', ['scheduled', 'confirmed']);

  if (error) throw new Error('Slot check failed.');

  return data.length > 0;
}

// ─── Book Appointment ─────────────────────────────────────────────────────────
async function bookAppointment({ patient_name, phone, doctor, date, time }) {
  // 1. Normalize date
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) throw new Error('Invalid date format.');

  // 2. Check not past
  const today = new Date().toISOString().split('T')[0];
  if (normalizedDate < today) throw new Error('Cannot book for a past date.');

  // 3. Normalize time
  const normalizedTime = time.substring(0, 5);

  // 4. Validate doctor
  const doctorData = await validateDoctor(doctor);

  // 5. Validate clinic hours
  await validateClinicHours(doctorData.organization_id, normalizedDate, normalizedTime);

  // 6. Check double booking
  const isBooked = await isSlotBooked(doctorData.id, normalizedDate, normalizedTime);
  if (isBooked) throw new Error('This slot is already booked.');

  // 7. Find or create patient
  const patient = await findOrCreatePatient(patient_name, phone, doctorData.organization_id);

  // 8. Generate booking code
  const bookingCode = generateBookingCode();

  // 9. Insert appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      patient_id: patient.id,
      doctor_id: doctorData.id,
      organization_id: doctorData.organization_id,
      appointment_date: normalizedDate,
      appointment_time: normalizedTime,
      status: 'scheduled',
      booking_code: bookingCode,
    })
    .select()
    .single();

  if (appointmentError || !appointment) {
    console.error('[bookAppointment] Insert error:', appointmentError);
    throw new Error('Failed to book appointment.');
  }

  return {
    appointment_id: appointment.id,
    patient_name: patient.name,
    phone: patient.phone,
    doctor: doctorData.name,
    date: normalizedDate,
    time: normalizedTime,
    status: appointment.status,
    booking_code: appointment.booking_code,
  };
}

// ─── Cancel Appointment ───────────────────────────────────────────────────────
async function cancelAppointment({ phone, booking_code }) {
  // 1. Find patient by phone
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, name')
    .eq('phone', phone)
    .limit(1)
    .single();

  if (patientError || !patient) {
    throw new Error('No patient found with this phone number.');
  }

  // 2. Find appointment by patient_id + booking_code
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, booking_code')
    .eq('patient_id', patient.id)
    .eq('booking_code', booking_code)
    .in('status', ['scheduled', 'confirmed'])
    .limit(1)
    .single();

  if (apptError || !appointment) {
    throw new Error('No active appointment found with this booking code.');
  }

  // 3. Update status to cancelled
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointment.id);

  if (updateError) throw new Error('Failed to cancel appointment.');

  return {
    booking_code: appointment.booking_code,
    patient_name: patient.name,
    date: appointment.appointment_date,
    time: appointment.appointment_time,
    status: 'cancelled',
    message: 'Appointment cancelled successfully.',
  };
}

// ─── Reschedule Appointment ───────────────────────────────────────────────────
async function rescheduleAppointment({ phone, booking_code, doctor, new_date, new_time }) {
  // 1. Cancel old appointment
  const cancelled = await cancelAppointment({ phone, booking_code });

  // 2. Get patient name
  const { data: patient } = await supabase
    .from('patients')
    .select('name')
    .eq('phone', phone)
    .limit(1)
    .single();

  const patientName = patient ? patient.name : 'Patient';

  // 3. Book new appointment
  const booked = await bookAppointment({
    patient_name: patientName,
    phone,
    doctor,
    date: new_date,
    time: new_time,
  });

  return {
    cancelled: {
      date: cancelled.date,
      time: cancelled.time,
    },
    booked: {
      appointment_id: booked.appointment_id,
      doctor: booked.doctor,
      date: booked.date,
      time: booked.time,
      booking_code: booked.booking_code,
    },
    message: 'Appointment rescheduled successfully.',
  };
}

module.exports = {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
};