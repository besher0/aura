const env = {
  PORT: Number(process.env.PORT || 8081),
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-secret'),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:8080',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
if (env.NODE_ENV === 'production' && !env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');
module.exports = env;
