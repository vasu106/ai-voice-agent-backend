/**
 * Generate all 15-minute time slots between open_time and close_time.
 * @param {string} openTime  - "HH:MM" e.g. "09:00"
 * @param {string} closeTime - "HH:MM" e.g. "17:00"
 * @returns {string[]} array of slot strings e.g. ["09:00","09:15","09:30",...]
 */
function generateSlots(openTime, closeTime) {
  const slots = [];

  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  let currentHour = openHour;
  let currentMin = openMin;

  const closeTotal = closeHour * 60 + closeMin;

  while (true) {
    const currentTotal = currentHour * 60 + currentMin;

    // Last slot must fully fit inside working hours (15 min slot)
    if (currentTotal + 15 > closeTotal) {
      break;
    }

    const hourStr = String(currentHour).padStart(2, '0');
    const minStr = String(currentMin).padStart(2, '0');
    slots.push(`${hourStr}:${minStr}`);

    currentMin += 15;

    if (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }

  return slots;
}

/**
 * Check if a given time string is within working hours (15-minute slot).
 * @param {string} time      - "HH:MM"
 * @param {string} openTime  - "HH:MM"
 * @param {string} closeTime - "HH:MM"
 * @returns {boolean}
 */
function isWithinWorkingHours(time, openTime, closeTime) {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const slotMinutes = toMinutes(time);
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);

  // Ensure full 15-min slot fits
  return slotMinutes >= openMinutes && slotMinutes + 15 <= closeMinutes;
}

/**
 * Normalize a date string to YYYY-MM-DD format.
 * @param {string} date
 * @returns {string|null}
 */
function normalizeDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().split('T')[0];
}

/**
 * Get day name from a date string.
 * @param {string} date - YYYY-MM-DD
 * @returns {string} e.g. "Monday"
 */
function getDayName(date) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const d = new Date(date + 'T00:00:00');
  return days[d.getDay()];
}

module.exports = {
  generateSlots,
  isWithinWorkingHours,
  normalizeDate,
  getDayName,
};