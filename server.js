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

async function startServer({
  refreshConfigFn = refreshConfig,
  createAppFn = createApp,
  setIntervalFn = setInterval,
  processObj = process
} = {}) {
  try {
    await refreshConfigFn();

    const app = createAppFn();
    const PORT = processObj.env.PORT || 8080;

    const refreshTimer = setIntervalFn(() => {
      refreshConfigFn().catch(err => {
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

module.exports = { createApp, startServer };