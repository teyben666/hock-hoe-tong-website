/** Detect common crawlers so we can skip splash / delay content for indexing. */
export function isSearchBot(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|applebot|semrushbot/i.test(
    navigator.userAgent
  );
}
