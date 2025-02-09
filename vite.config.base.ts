import { resolve } from "node:path";
import type { ManifestV3Export } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type BuildOptions, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { stripDevIcons } from "./custom-vite-plugins";
import manifest from "./manifest.json";
import pkg from "./package.json";

export const baseManifest = (_: { mode: string }) => {
  return {
    ...manifest,
    version: pkg.version,
  } satisfies ManifestV3Export;
};

export const baseWatch = ({ mode }: { mode: string }) => {
  const isDev = mode === "development";
  if (!isDev) return null;

  const include = [
    "vite.config.base.ts",
    "manifest.json",
    "src/**/*.{ts,tsx,css,html,json}",
  ].filter(Boolean) as (string | RegExp)[];

  return {
    include,
    exclude: ["src/**/*.spec.ts"],
  } as const satisfies BuildOptions["watch"];
};

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    publicDir: resolve(__dirname, "public"),
    sourcemap: isDev,
    emptyOutDir: !isDev,
    manifest: false,

    plugins: [
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.app.json"] }),
      react(),
      stripDevIcons(isDev),
    ],

    build: {
      watch: baseWatch({ mode }),
    },

    define: {
      ...(isDev ? { "import.meta.env.VITE_IS_DEV": "true" } : {}),
    },
  };
});
