# @neatsuite/http-umd

UMD/Browser bundle for [@neatsuite/http](https://www.npmjs.com/package/@neatsuite/http) - A TypeScript-first NetSuite API client.

This package provides a pre-built UMD bundle with all dependencies included, optimized for browser and AMD environments.

## Installation

### NPM/Yarn
```bash
npm install @neatsuite/http-umd
# or
yarn add @neatsuite/http-umd
```

### CDN
```html
<!-- Development build -->
<script src="https://unpkg.com/@neatsuite/http-umd/dist/netsuite-http.umd.js"></script>

<!-- Production build (minified) -->
<script src="https://unpkg.com/@neatsuite/http-umd/dist/netsuite-http.umd.min.js"></script>
```

## Usage

### Browser Global
```html
<script src="https://unpkg.com/@neatsuite/http-umd/dist/netsuite-http.umd.min.js"></script>
<script>
  const { NetSuiteClient } = neatHttp;
  
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
</script>
```

### AMD/RequireJS
```javascript
require.config({
  paths: {
    'netsuite-http': 'https://unpkg.com/@neatsuite/http-umd/dist/netsuite-http.umd.min'
  }
});

require(['netsuite-http'], function(neatHttp) {
  const { NetSuiteClient } = neatHttp;
  // Use the client
});
```

### ES Modules in Browser
```html
<script type="module">
  import neatHttp from 'https://unpkg.com/@neatsuite/http-umd/dist/netsuite-http.umd.js';
  const { NetSuiteClient } = neatHttp;
  // Use the client
</script>
```

## Bundle Details

- **Regular Build**: ~480KB (includes all dependencies)
- **Minified Build**: ~180KB (production-ready)
- **Global Name**: `neatHttp`
- **Included Dependencies**: axios, oauth-1.0a, p-retry

## Why a Separate Package?

The main `@neatsuite/http` package is optimized for Node.js environments where dependencies are managed separately. This UMD package:

- **Bundles all dependencies** for zero-config browser usage
- **Provides minified builds** for production
- **Supports multiple module systems** (AMD, CommonJS, browser global)
- **Keeps the main package lean** for Node.js users

## Documentation

For full API documentation and examples, see the main package: [@neatsuite/http](https://github.com/neatsuite/netsuite-http)

## License

MIT 