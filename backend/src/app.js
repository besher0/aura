const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const error = require('./middlewares/error.middleware');
const env = require('./config/env');
const app = express();
app.use(
  helmet({
    contentSecurityPolicy:
      env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'https://images.unsplash.com'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              scriptSrc: ["'self'"],
            },
          }
        : false,
  })
);
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api', routes);
if (env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../../frontend/dist/index.html')));
}
app.use(error);
module.exports = app;
