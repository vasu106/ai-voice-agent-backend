const supabase = require('../config/supabase');
const { generateSlots, normalizeDate, getDayName } = require('../utils/slotHelper');

/**
 * Get available appointment slots for a doctor on a given date.
 * @param {string} date   - YYYY-MM-DD
 * @param {string} doctor - doctor name or doctor_id
 * @returns {object}
 */
async function getAvailableSlots(date, doctor) {
  try {
    // 1. Normalize date
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }

    // 2. Check if date is in the past
    const today = new Date().toISOString().split('T')[0];
    if (normalizedDate < today) {
      throw new Error('Cannot get slots for a past date.');
    }

    // 3. Find doctor
    const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id, name, organization_id')
        .ilike('name', `%${doctor}%`)
        .limit(1)
        .single();

      if (doctorError) {
        console.error('[Doctor Error]', doctorError);
        throw new Error(`Doctor "${doctor}" not found.`);
      }

      if (!doctorData) {
        throw new Error(`Doctor "${doctor}" not found in database. Please add doctor to Supabase.`);
      }

    const doctorId = doctorData.id;
    const organizationId = doctorData.organization_id;

    // 4. Get day name (e.g. Friday)
    const dayName = getDayName(normalizedDate);

    // 5. Fetch clinic hours
    const { data: clinicHours, error: clinicHoursError } = await supabase
      .from('clinic_hours')
      .select('open_time, close_time, is_open')
      .eq('organization_id', organizationId)
      .eq('day_of_week', dayName);

    if (clinicHoursError) {
      console.error('[Clinic Hours Error]', clinicHoursError);
      throw new Error('Failed to fetch clinic hours.');
    }

    if (!clinicHours || clinicHours.length === 0) {
      throw new Error(`No clinic hours found for ${dayName}.`);
    }

    // 6. Filter open slots
    const openSlots = clinicHours.filter((slot) => slot.is_open);

    if (openSlots.length === 0) {
      throw new Error(`Clinic is closed on ${dayName}.`);
    }

    // 7. Generate all slots (morning + evening)
    let allSlots = [];

    for (const slot of openSlots) {
      const slots = generateSlots(slot.open_time, slot.close_time);
      allSlots = allSlots.concat(slots);
    }

    // 8. Get booked appointments
    const { data: bookedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', normalizedDate)
      .in('status', ['scheduled', 'confirmed']);

    if (appointmentsError) {
      console.error('[Appointments Error]', appointmentsError);
      throw new Error('Failed to fetch booked appointments.');
    }

    const bookedTimes = (bookedAppointments || []).map((a) =>
      a.appointment_time.substring(0, 5)
    );

    // 9. Remove booked slots
    const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

    // 10. Final response
    return {
      doctor: doctorData.name,
      date: normalizedDate,
      day: dayName,
      clinic_open: openSlots.map((s) => s.open_time),
      clinic_close: openSlots.map((s) => s.close_time),
      available_slots: availableSlots,
      total_available: availableSlots.length,
    };
  } catch (error) {
    console.error('[getAvailableSlots] Error:', error.message);
    throw error;
  }
}

module.exports = { getAvailableSlots };