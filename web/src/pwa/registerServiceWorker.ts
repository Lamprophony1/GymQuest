export function registerServiceWorker(): void {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-v2.js', { updateViaCache: 'none' }).catch((error: unknown) => {
      console.warn('No se pudo registrar el service worker de Proyecto RM.', error);
    });
  });
}
