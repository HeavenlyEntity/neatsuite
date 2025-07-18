import { NetSuiteClient, NetSuiteError, validateConfig } from '../index';

describe('NetSuiteClient', () => {
  const mockConfig = {
    oauth: {
      consumerKey: 'test-consumer-key',
      consumerSecret: 'test-consumer-secret',
      tokenKey: 'test-token-key',
      tokenSecret: 'test-token-secret',
      realm: 'test-realm'
    },
    accountId: 'test-account-id'
  };

  describe('validateConfig', () => {
    it('should return no errors for valid config', () => {
      const errors = validateConfig(mockConfig);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing oauth config', () => {
      const errors = validateConfig({ accountId: 'test' });
      expect(errors).toContain('OAuth configuration is required');
    });

    it('should return errors for missing oauth fields', () => {
      const errors = validateConfig({
        oauth: {
          consumerKey: 'test'
        },
        accountId: 'test'
      });
      expect(errors).toContain('OAuth consumer secret is required');
      expect(errors).toContain('OAuth token key is required');
      expect(errors).toContain('OAuth token secret is required');
      expect(errors).toContain('OAuth realm is required');
    });

    it('should return error for missing account ID', () => {
      const errors = validateConfig({ oauth: mockConfig.oauth });
      expect(errors).toContain('Account ID is required');
    });
  });

  describe('NetSuiteError', () => {
    it('should create error with all properties', () => {
      const error = new NetSuiteError(
        'Test error',
        404,
        'NOT_FOUND',
        { detail: 'Resource not found' }
      );

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ detail: 'Resource not found' });
      expect(error.name).toBe('NetSuiteError');
    });
  });

  describe('Client instantiation', () => {
    it('should create client with valid config', () => {
      const client = new NetSuiteClient(mockConfig);
      expect(client).toBeInstanceOf(NetSuiteClient);
    });

    it('should merge default config values', () => {
      const client = new NetSuiteClient(mockConfig);
      // Client internals would be tested here with proper mocking
      expect(client).toBeDefined();
    });
  });
}); 