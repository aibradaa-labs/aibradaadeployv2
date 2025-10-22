/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

export { };

// This allows TypeScript to pick up the ServiceWorker types
declare const registration: ServiceWorkerRegistration;