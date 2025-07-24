/**
 * UMD bundle for @neatsuite/http
 * This package provides a browser-ready UMD build
 * Note: Requires polyfills for Node.js built-ins (crypto, http, https)
 */

// For now, just export types and indicate this needs polyfills
export const REQUIRES_POLYFILLS = [
  'crypto',
  'http', 
  'https'
];

export const UMD_PACKAGE_INFO = {
  name: '@neatsuite/http-umd',
  version: '2.1.2',
  description: 'UMD build for @neatsuite/http',
  note: 'This package requires Node.js polyfills for browser usage'
};

// Re-export types from the main package
export type {
  NetSuiteConfig,
  NetSuiteOAuthConfig,
  NetSuiteRequestOptions,
  NetSuiteResponse,
  NetSuiteRestletParams,
  NetSuiteErrorResponse,
  HttpMethod,
  PerformanceResult,
  CacheOptions,
  RetryOptions,
  Middleware,
  RequestContext,
  Logger
} from '../../netsuite/src/types';

// Re-export utilities that don't require Node.js built-ins
export {
  ResponseCache,
  RateLimiter,
  RequestBatcher,
  createCacheKey,
  parseNetSuiteError,
  formatNetSuiteDate,
  parseNetSuiteDate,
  buildSearchQuery,
  sanitizeFieldValue,
  toInternalId,
  validateConfig
} from '../../netsuite/src/utils'; 