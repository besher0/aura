module.exports = (error, req, res, next) => {
  console.error(error);
  const status = error.status || (error.code === 'P2025' ? 404 : error.code === 'P2002' ? 409 : 500);
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : error.message,
    code: status === 500 ? 'INTERNAL_ERROR' : error.code,
  });
};
