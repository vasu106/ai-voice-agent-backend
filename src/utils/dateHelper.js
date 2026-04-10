/**
 * Returns today's date in YYYY-MM-DD format in IST (India Standard Time).
 */
function getTodayIST() {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
}

/**
 * Returns current year as string in IST.
 */
function getCurrentYearIST() {
  return getTodayIST().split('-')[0];
}

module.exports = { getTodayIST, getCurrentYearIST };