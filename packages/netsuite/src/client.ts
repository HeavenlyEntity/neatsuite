/**
 * NetSuite API Client
 * @module @neatsuite/http
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
let pRetry: any;

import('p-retry').then((module) => {
  pRetry = module;
});

import http from 'http';
import https from 'https';
import {
  NetSuiteConfig,
  NetSuiteRequestOptions,
  NetSuiteResponse,
  NetSuiteRestletParams,
  NetSuiteError,
  NetSuiteErrorResponse,
  PerformanceResult,
  HttpMethod,
  Middleware,
  Logger,
  RetryOptions
} from './types';

/**
 * NetSuite API Client
 * 
 * @example
 * ```typescript
 * import { NetSuiteClient } from '@neatsuite/http';
 * 
 * const client = new NetSuiteClient({
 *   oauth: {
 *     consumerKey: 'your-consumer-key',
 *     consumerSecret: 'your-consumer-secret',
 *     tokenKey: 'your-token-key',
 *     tokenSecret: 'your-token-secret',
 *     realm: 'your-realm'
 *   },
 *   accountId: 'your-account-id'
 * });
 * 
 * // Make a RESTlet call
 * const response = await client.restlet({
 *   script: '123',
 *   deploy: '1',
 *   params: { customParam: 'value' }
 * });
 * ```
 */
export class NetSuiteClient {
  private config: NetSuiteConfig;
  private oauth: OAuth;
  private axiosInstance: AxiosInstance;
  private middlewares: Middleware[] = [];
  private logger?: Logger;

  constructor(config: NetSuiteConfig, logger?: Logger) {
    this.config = {
      timeout: 15000,
      retries: 3,
      enablePerformanceLogging: false,
      ...config
    };

    this.logger = logger;

    // Initialize OAuth
    this.oauth = new OAuth({
      consumer: {
        key: config.oauth.consumerKey,
        secret: config.oauth.consumerSecret
      },
      signature_method: 'HMAC-SHA256',
      hash_function: (base_string: string, key: string) => {
        return crypto
          .createHmac('sha256', key)
          .update(base_string)
          .digest('base64');
      },
      realm: config.oauth.realm
    });

    // Create axios instance with optimized configuration
    this.axiosInstance = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...this.config.headers
      },
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
      maxRedirects: 5,
      validateStatus: (status: number) => status < 500
    });

    // Add request/response interceptors for logging
    if (this.config.enablePerformanceLogging || logger) {
      this.setupInterceptors();
    }
  }

  /**
   * Add middleware to the request pipeline
   * @param middleware - Middleware function
   */
  public use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Setup axios interceptors for logging
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.logger) {
          this.logger.debug('NetSuite API Request', {
            method: config.method,
            url: config.url,
            headers: config.headers
          });
        }
        return config;
      },
      (error) => {
        if (this.logger) {
          this.logger.error('NetSuite API Request Error', { error });
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (this.logger) {
          this.logger.debug('NetSuite API Response', {
            status: response.status,
            url: response.config.url,
            duration: (response.config as any)?.metadata?.duration
          });
        }
        return response;
      },
      (error) => {
        if (this.logger) {
          this.logger.error('NetSuite API Response Error', {
            status: error.response?.status,
            url: error.config?.url,
            error: error.message
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate OAuth authorization header
   */
  private generateAuthHeader(url: string, method: HttpMethod): Record<string, string> {
    const request_data = { url, method };
    const token = {
      key: this.config.oauth.tokenKey,
      secret: this.config.oauth.tokenSecret
    };

    return this.oauth.toHeader(this.oauth.authorize(request_data, token)) as any;
  }

  /**
   * Measure performance of an operation
   */
  private async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<PerformanceResult<T>> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      if (this.config.enablePerformanceLogging) {
        this.logger?.info(`[Performance] ${operation} completed`, { duration });
      }
      
      return { result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger?.error(`[Performance] ${operation} failed`, { duration, error });
      throw error;
    }
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddlewares(
    context: any,
    index: number,
    finalHandler: () => Promise<AxiosResponse>
  ): Promise<AxiosResponse> {
    if (index >= this.middlewares.length) {
      return finalHandler();
    }

    const middleware = this.middlewares[index];
    return middleware(context, () => 
      this.executeMiddlewares(context, index + 1, finalHandler)
    );
  }

  /**
   * Make a request to NetSuite API
   * 
   * @example
   * ```typescript
   * const response = await client.request({
   *   url: 'https://account.restlets.api.netsuite.com/app/site/hosting/restlet.nl',
   *   method: 'POST',
   *   body: { action: 'search', query: 'customer' }
   * });
   * ```
   */
  public async request<T = any>(options: NetSuiteRequestOptions): Promise<NetSuiteResponse<T>> {
    const {
      url,
      method = 'GET',
      body = null,
      headers = {},
      retries = this.config.retries,
      axiosConfig = {}
    } = options;

    // Generate OAuth authorization header
    const authHeader = this.generateAuthHeader(url, method);

    // Prepare request configuration
    const requestConfig: AxiosRequestConfig & { metadata?: any } = {
      method,
      url,
      headers: {
        ...authHeader,
        ...headers
      },
      ...axiosConfig,
      metadata: {}
    };

    // Add body for non-GET requests
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestConfig.data = body;
    }

    // Create retry options
    const retryOptions: RetryOptions = {
      retries: retries || 3,
      minTimeout: 1000,
      maxTimeout: 3000,
      shouldRetry: (error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          return false;
        }
        return true;
      },
      onFailedAttempt: (error: any) => {
        this.logger?.warn(`NetSuite API retry attempt`, {
          attemptNumber: error.attemptNumber,
          retriesLeft: error.retriesLeft
        });
      }
    };

    // Create the request function
    const makeRequest = async (): Promise<AxiosResponse> => {
      const startTime = Date.now();
      requestConfig.metadata.startTime = startTime;

      // Execute middleware chain
      const response = await this.executeMiddlewares(
        {
          config: options,
          authHeaders: authHeader,
          startTime
        },
        0,
        () => this.axiosInstance(requestConfig)
      );

      requestConfig.metadata.duration = Date.now() - startTime;

      // Check for successful response
      if (response.status !== 200) {
        throw new NetSuiteError(
          `NetSuite API returned status ${response.status}`,
          response.status,
          'HTTP_ERROR',
          response.data as NetSuiteErrorResponse,
          response
        );
      }

      return response;
    };

    // Make the request with retry logic
    const { result: response, duration }: { result: AxiosResponse, duration: number } = await this.measurePerformance(
      `NetSuite API ${method} ${url}`,
      () => pRetry(makeRequest, retryOptions as any)
    );

    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
      duration
    };
  }

  /**
   * Build NetSuite RESTlet URL
   */
  private buildRestletUrl(params: NetSuiteRestletParams): string {
    const baseUrl = `https://${this.config.accountId}.restlets.api.netsuite.com/app/site/hosting/restlet.nl`;
    const queryParams = new URLSearchParams({
      script: params.script.toString(),
      deploy: params.deploy.toString(),
      ...params.params
    } as any);
    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Make a RESTlet call
   * 
   * @example
   * ```typescript
   * const response = await client.restlet({
   *   script: '123',
   *   deploy: '1',
   *   params: { action: 'getCustomer', id: '456' }
   * });
   * ```
   */
  public async restlet<T = any>(
    params: NetSuiteRestletParams,
    options?: Partial<NetSuiteRequestOptions>
  ): Promise<NetSuiteResponse<T>> {
    const url = this.buildRestletUrl(params);
    return this.request<T>({
      url,
      ...options
    });
  }

  /**
   * GET request helper
   */
  public async get<T = any>(
    url: string,
    options?: Partial<NetSuiteRequestOptions>
  ): Promise<NetSuiteResponse<T>> {
    return this.request<T>({ ...options, url, method: 'GET' });
  }

  /**
   * POST request helper
   */
  public async post<T = any>(
    url: string,
    body?: any,
    options?: Partial<NetSuiteRequestOptions>
  ): Promise<NetSuiteResponse<T>> {
    return this.request<T>({ ...options, url, method: 'POST', body });
  }

  /**
   * PUT request helper
   */
  public async put<T = any>(
    url: string,
    body?: any,
    options?: Partial<NetSuiteRequestOptions>
  ): Promise<NetSuiteResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PUT', body });
  }

  /**
   * PATCH request helper
   */
  public async patch<T = any>(
    url: string,
    body?: any,
    options?: Partial<NetSuiteRequestOptions>
  ): Promise<NetSuiteResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PATCH', body });
  }

  /**
   * DELETE request helper
   */
  public async delete<T = any>(
    url: string,
    options?: Partial<NetSuiteRequestOptions>
  ): Promise<NetSuiteResponse<T>> {
    return this.request<T>({ ...options, url, method: 'DELETE' });
  }

  /**
   * Handle API errors
   */
  public static isNetSuiteError(error: any): error is NetSuiteError {
    return error instanceof NetSuiteError;
  }

  /**
   * Create error from axios error
   */
  public static createError(error: any): NetSuiteError {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new NetSuiteError(
        'Request timeout - NetSuite API is taking too long to respond',
        504,
        'TIMEOUT'
      );
    }

    if (error.response) {
      return new NetSuiteError(
        error.response.data?.detail || 'Error from NetSuite API',
        error.response.status,
        error.response.data?.['o:errorCode'],
        error.response.data,
        error.response
      );
    }

    return new NetSuiteError(
      error.message || 'Unknown error occurred',
      500,
      'UNKNOWN_ERROR'
    );
  }
} 