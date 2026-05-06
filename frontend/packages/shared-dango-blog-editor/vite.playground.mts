import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: "playground",
  plugins: [react()],
  resolve: {
    alias: {
      "shared-dango-blog-editor": resolve(here, "src/index.ts")
    }
  }
});
