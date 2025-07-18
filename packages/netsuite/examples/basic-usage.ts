import { NetSuiteClient, NetSuiteError, RateLimiter, ResponseCache } from '@neatsuite/http';

/**
 * Basic Usage Example for @neatsuite/http
 * With OAuth 1.0 authentication
 */

// Initialize the client with your credentials
const client = new NetSuiteClient({
  oauth: {
    consumerKey: process.env.NETSUITE_CONSUMER_KEY!,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET!,
    tokenKey: process.env.NETSUITE_TOKEN_KEY!,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET!,
    realm: process.env.NETSUITE_REALM!
  },
  accountId: process.env.NETSUITE_ACCOUNT_ID!,
  timeout: 30000,
  retries: 3,
  enablePerformanceLogging: true
});

// Example 1: Basic RESTlet call
async function getCustomerData() {
  try {
    const response = await client.restlet({
      script: '123',
      deploy: '1',
      params: {
        action: 'getCustomer',
        customerId: '456'
      }
    });

    console.log('Customer data:', response.data);
    console.log('Request took:', response.duration, 'ms');
  } catch (error) {
    if (NetSuiteClient.isNetSuiteError(error)) {
      console.error('NetSuite Error:', error.message);
      console.error('Status:', error.status);
      console.error('Details:', error.details);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 2: Using middleware for logging
client.use(async (context, next) => {
  console.log(`[${new Date().toISOString()}] ${context.config.method} ${context.config.url}`);
  const response = await next();
  console.log(`[${new Date().toISOString()}] Response: ${response.status}`);
  return response;
});

// Example 3: Rate limiting
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

async function rateLimitedRequest() {
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getTimeUntilNextRequest();
    console.log(`Rate limited. Please wait ${waitTime}ms`);
    return;
  }

  rateLimiter.recordRequest();
  const response = await client.get('https://api.netsuite.com/v1/records/customer/123');
  return response.data;
}

// Example 4: Caching responses
const cache = new ResponseCache();

async function getCachedCustomer(customerId: string) {
  const cacheKey = `customer:${customerId}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Returning cached data');
    return cached;
  }

  // Fetch from API
  const response = await client.restlet({
    script: '123',
    deploy: '1',
    params: { action: 'getCustomer', customerId }
  });

  // Cache for 5 minutes
  cache.set(cacheKey, response.data, 300);
  
  return response.data;
}

// Example 5: Batch operations
async function updateMultipleRecords(records: Array<{ id: string; data: any }>) {
  const results = await Promise.allSettled(
    records.map(record => 
      client.put(
        `https://api.netsuite.com/v1/records/customer/${record.id}`,
        record.data
      )
    )
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Record ${records[index].id} updated successfully`);
    } else {
      console.error(`Failed to update record ${records[index].id}:`, result.reason);
    }
  });
}

// Example 6: Search with typed response
interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

async function searchCustomers(query: string) {
  const response = await client.post<{ results: Customer[] }>(
    'https://api.netsuite.com/v1/search/customer',
    {
      query,
      fields: ['id', 'name', 'email', 'status'],
      limit: 100
    }
  );

  return response.data.results;
}

// Example 7: Error handling patterns
async function robustApiCall() {
  try {
    const response = await client.get('/api/v1/records/customer/999');
    return response.data;
  } catch (error) {
    if (NetSuiteClient.isNetSuiteError(error)) {
      switch (error.status) {
        case 404:
          console.log('Customer not found');
          return null;
        case 401:
          console.error('Authentication failed');
          throw new Error('Please check your credentials');
        case 429:
          console.error('Rate limited by NetSuite');
          throw new Error('Too many requests, please try again later');
        default:
          console.error('NetSuite API error:', error.message);
          throw error;
      }
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

// Run examples
async function main() {
  console.log('=== NetSuite API Examples ===\n');
  
  await getCustomerData();
  await getCachedCustomer('123');
  
  const customers = await searchCustomers('Acme');
  console.log(`Found ${customers.length} customers`);
}

// Execute if running directly
if (require.main === module) {
  main().catch(console.error);
} 