import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  esbuildOptions(options) {
    options.logOverride = { "this-is-undefined-in-esm": "silent" };
  },
  injectStyle: false
});
