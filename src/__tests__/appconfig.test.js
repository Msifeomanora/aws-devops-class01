
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-appconfigdata', () => ({
  AppConfigDataClient: jest.fn(() => ({
    send: mockSend
  })),
  StartConfigurationSessionCommand: jest.fn(input => ({ input })),
  GetLatestConfigurationCommand: jest.fn(input => ({ input }))
}));

function loadAppConfig() {
  jest.resetModules();
  return require('../../appconfig');
}

describe('AppConfig', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  test('returns default configuration initially', () => {
    const { getConfig } = loadAppConfig();

    expect(getConfig()).toEqual({
      maintenance_mode: false,
      show_new_banner: false
    });
  });

  test('starts a session and updates cached configuration', async () => {
    const { refreshConfig, getConfig } = loadAppConfig();

    mockSend
      .mockResolvedValueOnce({
        InitialConfigurationToken: 'test-token'
      })
      .mockResolvedValueOnce({
        NextPollConfigurationToken: 'next-token',
        Configuration: Buffer.from(JSON.stringify({
          maintenance_mode: true,
          show_new_banner: true
        }))
      });

    await refreshConfig();

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(getConfig()).toEqual({
      maintenance_mode: true,
      show_new_banner: true
    });
  });

  test('handles an empty configuration response', async () => {
    const { refreshConfig, getConfig } = loadAppConfig();

    mockSend
      .mockResolvedValueOnce({
        InitialConfigurationToken: 'test-token'
      })
      .mockResolvedValueOnce({
        NextPollConfigurationToken: 'next-token',
        Configuration: Buffer.alloc(0)
      });

    await refreshConfig();

    expect(getConfig()).toEqual({
      maintenance_mode: false,
      show_new_banner: false
    });
  });

  test('handles AppConfig errors without crashing', async () => {
    const { refreshConfig, getConfig } = loadAppConfig();

    mockSend.mockRejectedValue(new Error('AppConfig unavailable'));

    await expect(refreshConfig()).resolves.not.toThrow();

    expect(getConfig()).toEqual({
      maintenance_mode: false,
      show_new_banner: false
    });
  });
});
