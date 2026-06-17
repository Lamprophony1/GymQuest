export type AuthMode = 'dev-selector' | 'pin-login';

export function getAuthMode(): AuthMode {
  const configured = (import.meta.env.VITE_AUTH_MODE as string | undefined)?.toLowerCase();
  if (configured === 'pin-login' || configured === 'pin' || configured === 'production') {
    return 'pin-login';
  }

  if (configured === 'dev-selector' || configured === 'dev') {
    return 'dev-selector';
  }

  return import.meta.env.DEV ? 'dev-selector' : 'pin-login';
}
