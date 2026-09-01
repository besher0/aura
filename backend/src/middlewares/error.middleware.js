module.exports = (error, req, res, next) => {
  console.error(error);
  const isDatabaseUnavailable =
    error.name === 'PrismaClientInitializationError' ||
    error.code === 'P1001' ||
    error.message?.includes("Can't reach database server");
  if (isDatabaseUnavailable) {
    return res.status(503).json({
      success: false,
      message: 'تعذر الاتصال بقاعدة البيانات',
      code: 'DATABASE_UNAVAILABLE',
    });
  }
  const status = error.status || (error.code === 'P2025' ? 404 : error.code === 'P2002' ? 409 : 500);
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : error.message,
    code: status === 500 ? 'INTERNAL_ERROR' : error.code,
  });
};
