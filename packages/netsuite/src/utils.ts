/**
 * NetSuite API Utilities
 * @module @neatsuite/http
 */

import { NetSuiteError, NetSuiteResponse, CacheOptions } from './types';

/**
 * Simple in-memory cache for API responses
 */
export class ResponseCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  /**
   * Get cached response
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached response
   */
  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttl * 1000)
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request can be made
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Get remaining requests
   */
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get time until next request can be made
   */
  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

/**
 * Batch multiple requests together
 */
export class RequestBatcher<T> {
  private batch: Array<{
    key: string;
    resolve: (value: T) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimeout?: NodeJS.Timeout;
  private batchSize: number;
  private batchDelay: number;
  private batchProcessor: (keys: string[]) => Promise<Map<string, T>>;

  constructor(
    batchProcessor: (keys: string[]) => Promise<Map<string, T>>,
    batchSize: number = 10,
    batchDelay: number = 50
  ) {
    this.batchProcessor = batchProcessor;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * Add request to batch
   */
  add(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ key, resolve, reject });

      if (this.batch.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(), this.batchDelay);
      }
    });
  }

  /**
   * Process the current batch
   */
  private async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }

    const currentBatch = this.batch.splice(0, this.batchSize);
    if (currentBatch.length === 0) return;

    const keys = currentBatch.map(item => item.key);

    try {
      const results = await this.batchProcessor(keys);
      
      currentBatch.forEach(({ key, resolve, reject }) => {
        const result = results.get(key);
        if (result !== undefined) {
          resolve(result);
        } else {
          reject(new Error(`No result for key: ${key}`));
        }
      });
    } catch (error) {
      currentBatch.forEach(({ reject }) => reject(error));
    }
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt),
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a cache key from request options
 */
export function createCacheKey(
  url: string,
  method: string,
  params?: any
): string {
  const sortedParams = params ? 
    Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as any) : {};

  return `${method}:${url}:${JSON.stringify(sortedParams)}`;
}

/**
 * Parse NetSuite error response
 */
export function parseNetSuiteError(error: any): {
  message: string;
  code?: string;
  details?: any;
} {
  if (NetSuiteError.prototype.isPrototypeOf(error)) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }

  if (error.response?.data) {
    const data = error.response.data;
    return {
      message: data.detail || data.message || 'NetSuite API error',
      code: data['o:errorCode'] || data.code,
      details: data['o:errorDetails'] || data
    };
  }

  return {
    message: error.message || 'Unknown error',
    code: error.code,
    details: error
  };
}

/**
 * Format NetSuite date
 */
export function formatNetSuiteDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse NetSuite date
 */
export function parseNetSuiteDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00Z');
}

/**
 * Build query string for NetSuite searches
 */
export function buildSearchQuery(filters: Record<string, any>): string {
  return Object.entries(filters)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key} IN (${value.map(v => `'${v}'`).join(',')})`;
      }
      if (typeof value === 'string') {
        return `${key} = '${value}'`;
      }
      return `${key} = ${value}`;
    })
    .join(' AND ');
}

/**
 * Sanitize NetSuite field values
 */
export function sanitizeFieldValue(value: any): any {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    // Remove control characters and trim
    return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeFieldValue);
  }
  
  if (typeof value === 'object') {
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeFieldValue(val);
    }
    return sanitized;
  }
  
  return value;
}

/**
 * Convert NetSuite internal ID to string
 */
export function toInternalId(id: string | number): string {
  return String(id);
}

/**
 * Validate NetSuite configuration
 */
export function validateConfig(config: any): string[] {
  const errors: string[] = [];

  if (!config.oauth) {
    errors.push('OAuth configuration is required');
  } else {
    if (!config.oauth.consumerKey) errors.push('OAuth consumer key is required');
    if (!config.oauth.consumerSecret) errors.push('OAuth consumer secret is required');
    if (!config.oauth.tokenKey) errors.push('OAuth token key is required');
    if (!config.oauth.tokenSecret) errors.push('OAuth token secret is required');
    if (!config.oauth.realm) errors.push('OAuth realm is required');
  }

  if (!config.accountId) {
    errors.push('Account ID is required');
  }

  return errors;
} 