require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
app.listen(env.PORT, () => console.log(`Aura API listening on http://localhost:${env.PORT}`));
