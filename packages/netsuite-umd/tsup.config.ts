import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["umd"],
  globalName: "neatHttp",
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: {
    whitespace: true,
    syntax: true
  },
  // Bundle all dependencies for browser use
  noExternal: [/.*/],
  // Create both regular and minified builds
  outExtension() {
    return {
      js: '.umd.js'
    }
  },
  esbuildOptions(options) {
    options.footer = {
      js: `if (typeof module !== 'undefined') module.exports = neatHttp;`
    }
  },
  // Multiple entry points for different builds
  onSuccess: async () => {
    // Create minified version
    const { build } = await import('esbuild');
    await build({
      entryPoints: ['dist/netsuite-http.umd.js'],
      outfile: 'dist/netsuite-http.umd.min.js',
      minify: true,
      sourcemap: true,
      format: 'iife',
      globalName: 'neatHttp'
    });
  }
}); 