/**
 * Send a success JSON response.
 */
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

/**
 * Send an error JSON response.
 */
function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = {
  successResponse,
  errorResponse,
};