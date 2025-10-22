module.exports = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{js,css,html,png,jpg,jpeg,gif,svg,webp,woff,woff2,eot,ttf,webmanifest}"
  ],
  swDest: "dist/service-worker.js",
  sourcemap: false,
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  clientsClaim: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true
};
