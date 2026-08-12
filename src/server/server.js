const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const { initDB } = require('./database');

const app = express();

// Middlewares
app.use(cors({
  origin: config.CORS_ORIGINS,
  methods: config.CORS_METHODS,
  allowedHeaders: config.CORS_HEADERS,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// Démarrer le serveur
const PORT = config.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(` SERVEUR API OMDA`);
  console.log(`${'='.repeat(50)}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`${'='.repeat(50)}\n`);
  await initDB();
});