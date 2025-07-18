/**
 * @neatsuite/http - A TypeScript-first NetSuite API client
 * 
 * @packageDocumentation
 */

// Main client
export { NetSuiteClient } from './client';

// Error class (needs to be exported as value for instanceof checks)
export { NetSuiteError } from './types';

// Types
export type{
  // Configuration
  NetSuiteConfig,
  NetSuiteOAuthConfig,
  
  // Request/Response
  NetSuiteRequestOptions,
  NetSuiteResponse,
  NetSuiteRestletParams,
  HttpMethod,
  
  // Error handling
  NetSuiteErrorResponse,
  
  // Performance
  PerformanceResult,
  
  // Cache
  CacheOptions,
  
  // Retry
  RetryOptions,
  
  // Middleware
  Middleware,
  RequestContext,
  
  // Logger
  Logger
} from './types';

// Utilities
export {
  // Cache
  ResponseCache,
  
  // Rate limiting
  RateLimiter,
  
  // Batching
  RequestBatcher,
  
  // Helper functions
  retryWithBackoff,
  createCacheKey,
  parseNetSuiteError,
  formatNetSuiteDate,
  parseNetSuiteDate,
  buildSearchQuery,
  sanitizeFieldValue,
  toInternalId,
  validateConfig
} from './utils';

// Re-export commonly used types for convenience
export type { AxiosRequestConfig, AxiosResponse } from 'axios'; 