require('dotenv').config();

const express = require('express');
const path = require('path');
const { refreshConfig, getConfig } = require('./appconfig');

function createApp(configProvider = getConfig) {
  const app = express();

  app.get('/', (req, res) => {
    const config = configProvider();

    console.log('Config on request:', config);

    if (config.maintenance_mode) {
      return res.sendFile(
        path.join(__dirname, 'public', 'maintenance.html')
      );
    }

    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use(express.static(path.join(__dirname, 'public')));

  return app;
}

async function startServer() {
  try {
    await refreshConfig();

    const app = createApp();
    const PORT = process.env.PORT || 8080;

    const refreshTimer = setInterval(() => {
      refreshConfig().catch(err => {
        console.error('AppConfig refresh failed:', err.message);
      });
    }, 30000);

    refreshTimer.unref();

    app.listen(PORT, () => {
      console.log(`Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp };