/**
 * Convert a URL path to a filename slug.
 * /dashboard/settings → dashboard-settings
 * / → index
 */
export function urlToFilename(url: string): string {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;

    // Remove trailing slash
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }

    if (path === '/' || path === '') {
      return 'index';
    }

    // Convert path to slug
    return path
      .slice(1) // Remove leading /
      .replace(/\//g, '-')
      .replace(/[^a-z0-9-]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * Validate that a locator string looks like a valid Playwright locator.
 */
export function isValidLocator(locator: string): boolean {
  const validPatterns = [
    /^page\.getByRole\(/,
    /^page\.getByLabel\(/,
    /^page\.getByText\(/,
    /^page\.getByTestId\(/,
    /^page\.getByPlaceholder\(/,
    /^page\.getByAltText\(/,
    /^page\.getByTitle\(/,
    /^page\.locator\(/,
  ];

  return validPatterns.some((p) => p.test(locator));
}

/**
 * Build a fallback locator from role and name.
 */
export function buildRoleLocator(role: string, name?: string): string {
  if (name) {
    return `page.getByRole('${role}', { name: '${name.replace(/'/g, "\\'")}' })`;
  }
  return `page.getByRole('${role}')`;
}
