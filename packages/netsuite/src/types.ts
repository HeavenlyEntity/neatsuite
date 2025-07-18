/**
 * NetSuite API Client Types
 * @module @neatsuite/http
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * OAuth 1.0a configuration for NetSuite
 */
export interface NetSuiteOAuthConfig {
  consumerKey: string;
  consumerSecret: string;
  tokenKey: string;
  tokenSecret: string;
  realm: string;
}

/**
 * NetSuite client configuration
 */
export interface NetSuiteConfig {
  /** OAuth 1.0a configuration */
  oauth: NetSuiteOAuthConfig;
  /** NetSuite account URL ID (e.g., "1234567") */
  accountId: string;
  /** Optional timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** Optional number of retry attempts (default: 3) */
  retries?: number;
  /** Optional custom headers */
  headers?: Record<string, string>;
  /** Enable performance logging (default: false) */
  enablePerformanceLogging?: boolean;
}

/**
 * HTTP methods supported by the client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request options for NetSuite API calls
 */
export interface NetSuiteRequestOptions {
  /** Full NetSuite API URL */
  url: string;
  /** HTTP method */
  method?: HttpMethod;
  /** Request body for POST/PUT/PATCH requests */
  body?: any;
  /** Additional headers for this request */
  headers?: Record<string, string>;
  /** Override retries for this request */
  retries?: number;
  /** Custom axios config options */
  axiosConfig?: Partial<AxiosRequestConfig>;
}

/**
 * Response from NetSuite API
 */
export interface NetSuiteResponse<T = any> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Request duration in milliseconds */
  duration: number;
}

/**
 * NetSuite RESTlet parameters
 */
export interface NetSuiteRestletParams {
  /** Script ID */
  script: string | number;
  /** Deploy ID */
  deploy: string | number;
  /** Additional query parameters */
  params?: Record<string, string | number | boolean>;
}

/**
 * Performance measurement result
 */
export interface PerformanceResult<T> {
  result: T;
  duration: number;
}

/**
 * NetSuite error response
 */
export interface NetSuiteErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  'o:errorDetails'?: Array<{
    detail?: string;
    'o:errorCode'?: string;
  }>;
}

/**
 * Custom error class for NetSuite API errors
 */
export class NetSuiteError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: NetSuiteErrorResponse;
  public readonly response?: AxiosResponse;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: NetSuiteErrorResponse,
    response?: AxiosResponse
  ) {
    super(message);
    this.name = 'NetSuiteError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.response = response;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, NetSuiteError);
  }
}

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Number of retry attempts */
  retries: number;
  /** Minimum timeout between retries in ms */
  minTimeout?: number;
  /** Maximum timeout between retries in ms */
  maxTimeout?: number;
  /** Factor to multiply timeout by for each retry */
  factor?: number;
  /** Randomize timeout between retries */
  randomize?: boolean;
  /** Custom function to determine if retry should happen */
  shouldRetry?: (error: any) => boolean;
  /** Callback on failed attempt */
  onFailedAttempt?: (error: any) => void;
}

/**
 * Cache options for responses
 */
export interface CacheOptions {
  /** Cache TTL in seconds */
  ttl?: number;
  /** Key for caching */
  key?: string;
  /** Whether to use cache */
  enabled?: boolean;
}

/**
 * Request context for middleware
 */
export interface RequestContext {
  /** Request configuration */
  config: NetSuiteRequestOptions;
  /** OAuth headers */
  authHeaders: Record<string, string>;
  /** Start time of request */
  startTime: number;
}

/**
 * Middleware function type
 */
export type Middleware = (
  context: RequestContext,
  next: () => Promise<AxiosResponse>
) => Promise<AxiosResponse>;

/**
 * Logger interface for custom logging
 */
export interface Logger {
  debug: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
} 