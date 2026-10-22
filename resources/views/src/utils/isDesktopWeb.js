/**
 * Desktop web detection shared by routing and auth.
 * Uses the same 768px breakpoint as UserAppLayout so all checks agree.
 * Always false outside a browser (native / SSR).
 */
export const DESKTOP_WEB_MIN_WIDTH = 768;

export function isDesktopWeb() {
  if (typeof window === 'undefined' || typeof window.innerWidth !== 'number') {
    return false;
  }
  return window.innerWidth >= DESKTOP_WEB_MIN_WIDTH;
}

export default isDesktopWeb;
