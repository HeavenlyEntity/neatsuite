# @neatsuite/http-umd

UMD/Browser utilities for [@neatsuite/http](https://www.npmjs.com/package/@neatsuite/http) - A TypeScript-first NetSuite API client.

This package provides browser-compatible utilities and types from the main package. For full NetSuite API functionality, use the main package in Node.js environments.

## Installation

### NPM/Yarn
```bash
npm install @neatsuite/http-umd
# or
yarn add @neatsuite/http-umd
```

### CDN
```html
<script src="https://unpkg.com/@neatsuite/http-umd/dist/index.umd.js"></script>
```

## Usage

### Browser Global
```html
<script src="https://unpkg.com/@neatsuite/http-umd/dist/index.umd.js"></script>
<script>
  const { 
    ResponseCache, 
    RateLimiter, 
    RequestBatcher,
    formatNetSuiteDate,
    parseNetSuiteDate,
    buildSearchQuery,
    UMD_PACKAGE_INFO 
  } = neatHttp;
  
  console.log('Package info:', UMD_PACKAGE_INFO);
  
  // Use utilities
  const cache = new ResponseCache();
  const limiter = new RateLimiter(10, 60000);
  const formattedDate = formatNetSuiteDate(new Date());
</script>
```

### AMD/RequireJS
```javascript
require.config({
  paths: {
    'netsuite-http-utils': 'https://unpkg.com/@neatsuite/http-umd/dist/index.umd'
  }
});

require(['netsuite-http-utils'], function(netSuiteUtils) {
  const { ResponseCache, RateLimiter } = netSuiteUtils;
  // Use the utilities
});
```

### ES Modules in Browser
```html
<script type="module">
  import netSuiteUtils from 'https://unpkg.com/@neatsuite/http-umd/dist/index.umd.js';
  const { ResponseCache, formatNetSuiteDate } = netSuiteUtils;
  // Use the utilities
</script>
```

## Bundle Details

- **Build Size**: ~9KB (utilities and types only)
- **Global Name**: `neatHttp`
- **Exports**: Browser-compatible utilities and TypeScript types
- **Dependencies**: None (utilities are self-contained)

## What's Included

This package provides:
- **Utilities**: ResponseCache, RateLimiter, RequestBatcher
- **Helper Functions**: Date formatting, query building, field sanitization
- **TypeScript Types**: All interfaces and types from the main package
- **Validation**: Configuration validation utilities

## Why a Separate Package?

The main `@neatsuite/http` package requires Node.js built-ins (crypto, http, https) for OAuth 1.0a authentication, making it unsuitable for direct browser use. This UMD package:

- **Provides browser-compatible utilities** without Node.js dependencies
- **Exports TypeScript types** for development
- **Supports multiple module systems** (AMD, CommonJS, browser global)
- **Keeps bundle size minimal** by excluding Node.js-specific code

## Documentation

For full API documentation and examples, see the main package: [@neatsuite/http](https://github.com/neatsuite/netsuite-http)

## License

MIT 