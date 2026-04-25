import { describe, it, expect } from 'vitest';
import { urlToFilename, isValidLocator, buildRoleLocator } from '../codegen/selector-strategy.js';

describe('urlToFilename', () => {
  it('should convert root URL to "index"', () => {
    expect(urlToFilename('https://example.com')).toBe('index');
    expect(urlToFilename('https://example.com/')).toBe('index');
  });

  it('should convert path to slug', () => {
    expect(urlToFilename('https://example.com/dashboard')).toBe('dashboard');
    expect(urlToFilename('https://example.com/dashboard/settings')).toBe('dashboard-settings');
  });

  it('should handle special characters', () => {
    expect(urlToFilename('https://example.com/my-page_1')).toBe('my-page-1');
  });

  it('should handle trailing slashes', () => {
    expect(urlToFilename('https://example.com/about/')).toBe('about');
  });

  it('should return "unknown" for invalid URLs', () => {
    expect(urlToFilename('not-a-url')).toBe('unknown');
  });

  it('should lowercase the result', () => {
    expect(urlToFilename('https://example.com/Dashboard/Settings')).toBe('dashboard-settings');
  });
});

describe('isValidLocator', () => {
  it('should accept getByRole locators', () => {
    expect(isValidLocator("page.getByRole('button', { name: 'Submit' })")).toBe(true);
  });

  it('should accept getByLabel locators', () => {
    expect(isValidLocator("page.getByLabel('Email')")).toBe(true);
  });

  it('should accept getByText locators', () => {
    expect(isValidLocator("page.getByText('Hello')")).toBe(true);
  });

  it('should accept getByTestId locators', () => {
    expect(isValidLocator("page.getByTestId('search-input')")).toBe(true);
  });

  it('should accept getByPlaceholder locators', () => {
    expect(isValidLocator("page.getByPlaceholder('Search...')")).toBe(true);
  });

  it('should accept CSS locators', () => {
    expect(isValidLocator("page.locator('.btn-primary')")).toBe(true);
  });

  it('should reject invalid locators', () => {
    expect(isValidLocator('button.submit')).toBe(false);
    expect(isValidLocator('#search')).toBe(false);
    expect(isValidLocator('')).toBe(false);
  });
});

describe('buildRoleLocator', () => {
  it('should build a role locator with name', () => {
    expect(buildRoleLocator('button', 'Submit')).toBe("page.getByRole('button', { name: 'Submit' })");
  });

  it('should build a role locator without name', () => {
    expect(buildRoleLocator('heading')).toBe("page.getByRole('heading')");
  });

  it('should escape single quotes in name', () => {
    expect(buildRoleLocator('button', "Don't click")).toBe("page.getByRole('button', { name: 'Don\\'t click' })");
  });
});
