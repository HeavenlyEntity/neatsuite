import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm", "umd"],
  globalName: "neatHttp",
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: ["crypto", "http", "https"],
  treeshake: true,
  // Bundle main dependencies for UMD
  noExternal: ["axios", "oauth-1.0a", "p-retry"],
  // Custom output names
  outExtension({ format }) {
    return {
      js: format === 'umd' ? '.umd.js' : format === 'cjs' ? '.js' : '.mjs'
    }
  }
}); 