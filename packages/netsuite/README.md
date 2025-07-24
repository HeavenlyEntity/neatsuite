# @neatsuite/http

A TypeScript-first NetSuite API client with built-in OAuth 1.0a authentication, automatic retries, performance monitoring, and excellent developer experience. Lightweight and using only 3 dependencies.

## Features

- 🔐 **OAuth 1.0a Authentication** - Built-in support for NetSuite's OAuth requirements
- 🔄 **Automatic Retries** - Configurable retry logic with exponential backoff
- 📊 **Performance Monitoring** - Track API call durations and performance metrics
- 🎯 **TypeScript First** - Full type safety and IntelliSense support
- 🚀 **Optimized** - Connection pooling, compression, and efficient error handling
- 🛠️ **Developer Friendly** - Clean API, detailed errors, and extensive utilities
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔌 **Extensible** - Middleware support for custom logic

## Installation

```bash
npm install @neatsuite/http
# or
yarn add @neatsuite/http
# or
pnpm add @neatsuite/http
```

## Quick Start

```typescript
import { NetSuiteClient } from '@neatsuite/http';

// Initialize the client
const client = new NetSuiteClient({
  oauth: {
    consumerKey: 'your-consumer-key',
    consumerSecret: 'your-consumer-secret',
    tokenKey: 'your-token-key',
    tokenSecret: 'your-token-secret',
    realm: 'your-realm'
  },
  accountId: 'your-account-id'
});

// Make a RESTlet call
const response = await client.restlet({
  script: '123',
  deploy: '1',
  params: { action: 'getCustomer', id: '456' }
});

console.log(response.data);
```

## Configuration

```typescript
const client = new NetSuiteClient({
  oauth: {
    consumerKey: process.env.NETSUITE_CONSUMER_KEY!,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET!,
    tokenKey: process.env.NETSUITE_TOKEN_KEY!,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET!,
    realm: process.env.NETSUITE_REALM!
  },
  accountId: process.env.NETSUITE_ACCOUNT_ID!,
  
  // Optional configuration
  timeout: 30000,              // Request timeout in ms (default: 15000)
  retries: 5,                  // Number of retry attempts (default: 3)
  enablePerformanceLogging: true, // Log performance metrics (default: false)
  headers: {                   // Custom headers for all requests
    'User-Agent': 'MyApp/1.0'
  }
});
```

## API Methods

### RESTlet Calls

```typescript
// GET request to a RESTlet
const response = await client.restlet({
  script: '123',
  deploy: '1',
  params: { 
    action: 'search',
    type: 'customer',
    query: 'Acme Corp'
  }
});

// POST request to a RESTlet
const response = await client.restlet(
  {
    script: '456',
    deploy: '2'
  },
  {
    method: 'POST',
    body: {
      action: 'create',
      record: {
        name: 'New Customer',
        email: 'customer@example.com'
      }
    }
  }
);
```

### Direct API Calls

```typescript
// GET request
const response = await client.get('https://api.netsuite.com/v1/records/customer/123');

// POST request
const response = await client.post(
  'https://api.netsuite.com/v1/records/customer',
  {
    name: 'New Customer',
    email: 'customer@example.com'
  }
);

// PUT request
const response = await client.put(
  'https://api.netsuite.com/v1/records/customer/123',
  { email: 'updated@example.com' }
);

// DELETE request
const response = await client.delete('https://api.netsuite.com/v1/records/customer/123');
```

### Generic Request Method

```typescript
const response = await client.request({
  url: 'https://api.netsuite.com/v1/records/customer',
  method: 'POST',
  body: { name: 'New Customer' },
  headers: { 'X-Custom-Header': 'value' },
  retries: 5 // Override default retries for this request
});
```

## Error Handling

```typescript
import { NetSuiteClient, NetSuiteError } from '@neatsuite/http';

try {
  const response = await client.get('/api/v1/records/customer/999999');
} catch (error) {
  if (NetSuiteClient.isNetSuiteError(error)) {
    console.error('NetSuite Error:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Middleware

Add custom logic to all requests:

```typescript
// Add authentication token to all requests
client.use(async (context, next) => {
  context.config.headers = {
    ...context.config.headers,
    'X-Auth-Token': await getAuthToken()
  };
  return next();
});

// Log all requests
client.use(async (context, next) => {
  console.log(`Making request to ${context.config.url}`);
  const response = await next();
  console.log(`Response status: ${response.status}`);
  return response;
});
```

## Utilities

### Response Caching

```typescript
import { ResponseCache, createCacheKey } from '@neatsuite/http';

const cache = new ResponseCache();

// Cache a response
const key = createCacheKey(url, 'GET', params);
cache.set(key, responseData, 300); // Cache for 5 minutes

// Get cached response
const cached = cache.get(key);
if (cached) {
  return cached;
}
```

### Rate Limiting

```typescript
import { RateLimiter } from '@neatsuite/http';

const limiter = new RateLimiter(100, 60000); // 100 requests per minute

if (limiter.canMakeRequest()) {
  limiter.recordRequest();
  const response = await client.get(url);
} else {
  const waitTime = limiter.getTimeUntilNextRequest();
  console.log(`Rate limited. Wait ${waitTime}ms`);
}
```

### Request Batching

```typescript
import { RequestBatcher } from '@neatsuite/http';

const batcher = new RequestBatcher(async (ids) => {
  const response = await client.post('/api/batch', { ids });
  return new Map(response.data.map(item => [item.id, item]));
});

// These requests will be batched together
const [user1, user2, user3] = await Promise.all([
  batcher.add('123'),
  batcher.add('456'),
  batcher.add('789')
]);
```

### Date Utilities

```typescript
import { formatNetSuiteDate, parseNetSuiteDate } from '@neatsuite/http';

// Format date for NetSuite
const nsDate = formatNetSuiteDate(new Date()); // "2024-01-15"

// Parse date from NetSuite
const date = parseNetSuiteDate("2024-01-15"); // Date object
```

### Query Building

```typescript
import { buildSearchQuery } from '@neatsuite/http';

const query = buildSearchQuery({
  type: 'customer',
  status: 'active',
  created: ['2024-01-01', '2024-01-31'],
  tags: ['vip', 'premium']
});
// "type = 'customer' AND status = 'active' AND created IN ('2024-01-01','2024-01-31') AND tags IN ('vip','premium')"
```

## Custom Logger

```typescript
import { Logger } from '@neatsuite/http';

const customLogger: Logger = {
  debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta),
  info: (message, meta) => console.info(`[INFO] ${message}`, meta),
  warn: (message, meta) => console.warn(`[WARN] ${message}`, meta),
  error: (message, meta) => console.error(`[ERROR] ${message}`, meta)
};

const client = new NetSuiteClient(config, customLogger);
```

## Best Practices

1. **Environment Variables**: Store OAuth credentials securely
   ```typescript
   const client = new NetSuiteClient({
     oauth: {
       consumerKey: process.env.NETSUITE_CONSUMER_KEY!,
       consumerSecret: process.env.NETSUITE_CONSUMER_SECRET!,
       tokenKey: process.env.NETSUITE_TOKEN_KEY!,
       tokenSecret: process.env.NETSUITE_TOKEN_SECRET!,
       realm: process.env.NETSUITE_REALM!
     },
     accountId: process.env.NETSUITE_ACCOUNT_ID!
   });
   ```

2. **Error Handling**: Always wrap API calls in try-catch blocks
   ```typescript
   try {
     const response = await client.get(url);
     return response.data;
   } catch (error) {
     if (NetSuiteClient.isNetSuiteError(error) && error.status === 404) {
       return null; // Handle not found
     }
     throw error; // Re-throw other errors
   }
   ```

3. **Rate Limiting**: Implement rate limiting for high-volume operations
   ```typescript
   const limiter = new RateLimiter(10, 1000); // 10 requests per second
   
   for (const id of largeIdList) {
     while (!limiter.canMakeRequest()) {
       await new Promise(resolve => setTimeout(resolve, 100));
     }
     limiter.recordRequest();
     await client.get(`/api/v1/records/customer/${id}`);
   }
   ```

4. **Caching**: Cache frequently accessed, rarely changing data
   ```typescript
   const cache = new ResponseCache();
   
   async function getCustomer(id: string) {
     const cacheKey = `customer:${id}`;
     const cached = cache.get(cacheKey);
     if (cached) return cached;
     
     const response = await client.get(`/api/v1/records/customer/${id}`);
     cache.set(cacheKey, response.data, 3600); // Cache for 1 hour
     return response.data;
   }
   ```

## Module Formats

This package provides optimized builds for Node.js environments:

- **ES Modules (ESM)**: `import { NetSuiteClient } from '@neatsuite/http'`
- **CommonJS (CJS)**: `const { NetSuiteClient } = require('@neatsuite/http')`

### Browser/UMD Usage

For browser, AMD/RequireJS, and UMD environments, use the separate UMD package:

```bash
npm install @neatsuite/http-umd
```

The UMD package includes all dependencies bundled and provides:
- Browser global support (`neatHttp`)
- AMD/RequireJS compatibility
- Minified production builds
- CDN support

See [@neatsuite/http-umd](https://www.npmjs.com/package/@neatsuite/http-umd) for browser usage examples.

## TypeScript Support

This package is written in TypeScript and provides comprehensive type definitions:

```typescript
import type { 
  NetSuiteConfig,
  NetSuiteResponse,
  NetSuiteError,
  NetSuiteRequestOptions 
} from '@neatsuite/http';

// Type-safe configuration
const config: NetSuiteConfig = {
  oauth: {
    consumerKey: '...',
    consumerSecret: '...',
    tokenKey: '...',
    tokenSecret: '...',
    realm: '...'
  },
  accountId: '...'
};

// Type-safe responses
const response: NetSuiteResponse<Customer> = await client.get<Customer>('/api/v1/customer/123');
const customer: Customer = response.data;
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/neatsuite/netsuite-http/issues). 