/**
 * AMD Usage Example for @neatsuite/http
 * Using RequireJS or similar AMD loader
 */

// Configure RequireJS (if using programmatically)
if (typeof require !== 'undefined' && require.config) {
    require.config({
        paths: {
            // Point to the UMD build
            'netsuite-http': './node_modules/@neatsuite/http/dist/index.umd',
            // Or from a CDN:
            // 'netsuite-http': 'https://unpkg.com/@neatsuite/http@latest/dist/index.umd'
        }
    });
}

// Define a module that depends on @neatsuite/http
define(['netsuite-http'], function(neatHttp) {
    'use strict';
    
    const { NetSuiteClient, NetSuiteError, RateLimiter, ResponseCache } = neatHttp;
    
    /**
     * NetSuite API Service using AMD
     */
    function NetSuiteService(config) {
        this.client = new NetSuiteClient(config);
        this.cache = new ResponseCache();
        this.rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
    }
    
    NetSuiteService.prototype.getCustomer = async function(customerId) {
        // Check rate limit
        if (!this.rateLimiter.canMakeRequest()) {
            const waitTime = this.rateLimiter.getTimeUntilNextRequest();
            throw new Error(`Rate limited. Please wait ${waitTime}ms`);
        }
        
        // Check cache
        const cacheKey = `customer:${customerId}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        
        try {
            this.rateLimiter.recordRequest();
            
            const response = await this.client.restlet({
                script: '123',
                deploy: '1',
                params: {
                    action: 'getCustomer',
                    customerId: customerId
                }
            });
            
            // Cache for 5 minutes
            this.cache.set(cacheKey, response.data, 300);
            
            return response.data;
        } catch (error) {
            if (NetSuiteClient.isNetSuiteError(error)) {
                console.error('NetSuite API Error:', error.message);
                throw new Error(`Failed to get customer: ${error.message}`);
            }
            throw error;
        }
    };
    
    NetSuiteService.prototype.searchCustomers = async function(query) {
        try {
            const response = await this.client.post('/api/v1/search/customer', {
                query: query,
                fields: ['id', 'name', 'email', 'status'],
                limit: 100
            });
            
            return response.data.results;
        } catch (error) {
            if (NetSuiteClient.isNetSuiteError(error)) {
                console.error('Search failed:', error.message);
                return [];
            }
            throw error;
        }
    };
    
    // Return the service constructor
    return NetSuiteService;
});

// Alternative: Use require() for immediate execution
require(['netsuite-http'], function(neatHttp) {
    const { NetSuiteClient } = neatHttp;
    
    // Example immediate usage
    const client = new NetSuiteClient({
        oauth: {
            consumerKey: process.env.NETSUITE_CONSUMER_KEY,
            consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
            tokenKey: process.env.NETSUITE_TOKEN_KEY,
            tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
            realm: process.env.NETSUITE_REALM
        },
        accountId: process.env.NETSUITE_ACCOUNT_ID
    });
    
    console.log('NetSuite client initialized successfully in AMD environment');
}); 