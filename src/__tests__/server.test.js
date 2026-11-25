const request = require('supertest');
const path = require('path');
const { createApp, startServer } = require('../../server');

describe('Express Application', () => {
  test('serves homepage when maintenance mode is disabled', async () => {
    const app = createApp(() => ({
      maintenance_mode: false,
      show_new_banner: false
    }));

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.type).toContain('html');
  });

  test('serves maintenance page when maintenance mode is enabled', async () => {
    const app = createApp(() => ({
      maintenance_mode: true,
      show_new_banner: false
    }));

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Maintenance');
  });

  test('serves static HTML files', async () => {
    const app = createApp();

    const response = await request(app).get('/index.html');

    expect(response.status).toBe(200);
  });

  test('returns 404 for unknown routes', async () => {
    const app = createApp();

    const response = await request(app).get('/unknown-page');

    expect(response.status).toBe(404);
  });

  test('uses default configuration provider when none is supplied', () => {
    const app = createApp();

    expect(app).toBeDefined();
  });
});
describe('Server startup', () => {
  test('uses default port 8080 when PORT is not set', async () => {
  const mockListen = jest.fn((port, callback) => callback());
  const mockTimer = { unref: jest.fn() };

  await startServer({
    refreshConfigFn: jest.fn().mockResolvedValue(),
    createAppFn: () => ({ listen: mockListen }),
    setIntervalFn: jest.fn().mockReturnValue(mockTimer),
    processObj: { env: {}, exitCode: 0 }
  });

  expect(mockListen).toHaveBeenCalledWith(8080, expect.any(Function));
});

test('handles configuration refresh failure during startup', async () => {
  const error = new Error('Configuration unavailable');
  const mockProcess = { env: {}, exitCode: 0 };
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await startServer({
    refreshConfigFn: jest.fn().mockRejectedValue(error),
    processObj: mockProcess
  });

  expect(errorSpy).toHaveBeenCalledWith('Failed to start:', error);
  expect(mockProcess.exitCode).toBe(1);

  errorSpy.mockRestore();
});
test('logs errors when scheduled configuration refresh fails', async () => {
  const error = new Error('Scheduled refresh failed');
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  let scheduledRefresh;

  await startServer({
    refreshConfigFn: jest.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(error),
    createAppFn: () => ({ listen: jest.fn() }),
    setIntervalFn: jest.fn((callback) => {
      scheduledRefresh = callback;
      return { unref: jest.fn() };
    }),
    processObj: { env: {}, exitCode: 0 }
  });

  scheduledRefresh();

  await new Promise(resolve => setImmediate(resolve));

  expect(errorSpy).toHaveBeenCalledWith(
    'AppConfig refresh failed:',
    error.message
  );

  errorSpy.mockRestore();
});
});
