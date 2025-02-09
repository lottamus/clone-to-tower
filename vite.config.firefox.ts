import { resolve } from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { type UserConfig, defineConfig, mergeConfig } from "vite";
import baseConfig, { baseManifest, baseWatch } from "./vite.config.base";

export default defineConfig((configEnv) => {
  const base = baseConfig(configEnv);
  const manifest = baseManifest({ mode: configEnv.mode });
  const watch = baseWatch({ mode: configEnv.mode });

  return mergeConfig(base, {
    plugins: [
      crx({
        browser: "firefox",
        manifest,
        contentScripts: {
          injectCss: true,
        },
      }),
    ],
    build: {
      outDir: resolve(__dirname, "dist/firefox"),

      watch: watch
        ? {
            ...watch,
            include: [...watch.include, "vite.config.firefox.ts"],
          }
        : undefined,
    },
  } satisfies UserConfig);
});
