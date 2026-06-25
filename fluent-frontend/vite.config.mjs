import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Fluent",
        short_name: "Fluent",
        description: "Progressive spaced repetition system",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#303f9f",
        background_color: "#ffffff",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "logo192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any",
          },
          {
            src: "logo512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any",
          },
          {
            src: "logo-maskable-192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "maskable",
          },
          {
            src: "logo-maskable-512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Review / usercourse updates are PATCHes to `usercourses`.
            // When offline or on a flaky network the request is queued in
            // IndexedDB and replayed automatically once connectivity is
            // back, so review progress is never lost. The review UI already
            // advances optimistically, so this only adds durable sync.
            urlPattern: /usercourses(\?|$)/,
            handler: "NetworkOnly",
            method: "PATCH",
            options: {
              backgroundSync: {
                name: "usercourse-sync-queue",
                options: {
                  maxRetentionTime: 24 * 60, // retry for up to 24h (minutes)
                },
              },
            },
          },
        ],
      },
    }),
  ],
  base: "/",
  server: {
    port: 3000,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
  },
});
