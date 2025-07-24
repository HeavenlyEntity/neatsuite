import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["iife"],
  globalName: "neatHttp", 
  outDir: "dist",
  outExtension({ format }) {
    return {
      js: `.umd.js`
    }
  },
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2015",
  // Bundle all dependencies
  noExternal: [/.*/],
  // Platform for browser
  platform: "browser"
}); 