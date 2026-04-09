const supabase = require('../config/supabase');
const { normalizeDate, getDayName, isWithinWorkingHours } = require('../utils/slotHelper');

// 🔥 Booking Code Generator
function generateBookingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Find or create patient
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
    throw new Error('Failed to create patient.');
  }

  return newPatient;
}

// Validate doctor
async function validateDoctor(doctor) {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, name, organization_id')
    .ilike('name', `%${doctor}%`)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Doctor "${doctor}" not found.`);
  }

  return data;
}

// Validate clinic hours
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
    throw new Error('Selected time is outside working hours.');
  }
}

// Check slot
async function isSlotBooked(doctorId, date, time) {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .eq('appointment_time', time)
    .in('status', ['scheduled', 'confirmed']);

  if (error) throw new Error('Slot check failed');

  return data.length > 0;
}

// 🔥 BOOK APPOINTMENT (FINAL)
async function bookAppointment({ patient_name, phone, doctor, date, time }) {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) throw new Error('Invalid date');

  const today = new Date().toISOString().split('T')[0];
  if (normalizedDate < today) throw new Error('Past date not allowed');

  const normalizedTime = time.substring(0, 5);

  const doctorData = await validateDoctor(doctor);

  await validateClinicHours(
    doctorData.organization_id,
    normalizedDate,
    normalizedTime
  );

  const isBooked = await isSlotBooked(
    doctorData.id,
    normalizedDate,
    normalizedTime
  );

  if (isBooked) {
    throw new Error('Slot already booked');
  }

  const patient = await findOrCreatePatient(
    patient_name,
    phone,
    doctorData.organization_id
  );

  const bookingCode = generateBookingCode();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: patient.id,
      doctor_id: doctorData.id,
      organization_id: doctorData.organization_id,
      appointment_date: normalizedDate,
      appointment_time: normalizedTime,
      patient_name: patient.name,
      patient_phone: patient.phone,
      booking_code: bookingCode,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) throw new Error('Booking failed');

  return {
    appointment_id: appointment.id,
    booking_code: bookingCode,
    patient_name: patient.name,
    phone: patient.phone,
    doctor: doctorData.name,
    date: normalizedDate,
    time: normalizedTime,
  };
}

// CANCEL
async function cancelAppointment({ phone, booking_code }) {
  // 1. Find appointment using phone + booking_code
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_phone', phone)
    .eq('booking_code', booking_code)
    .in('status', ['scheduled', 'confirmed'])
    .limit(1)
    .single();

  if (error || !appointment) {
    throw new Error('Invalid booking code or no active appointment found.');
  }

  // 2. Cancel appointment
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointment.id);

  if (updateError) {
    throw new Error('Failed to cancel appointment.');
  }

  return {
    booking_code: appointment.booking_code,
    patient_name: appointment.patient_name,
    date: appointment.appointment_date,
    time: appointment.appointment_time,
    status: 'cancelled',
  };
}
// RESCHEDULE
async function rescheduleAppointment(data) {
  await cancelAppointment(data.phone, data.old_date);

  return await bookAppointment({
    patient_name: data.patient_name || 'Patient',
    phone: data.phone,
    doctor: data.doctor,
    date: data.new_date,
    time: data.new_time,
  });
}

module.exports = {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
};