import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SEOHead } from '../SEOHead';

function renderSEOHead(props: Parameters<typeof SEOHead>[0], route = '/en') {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/:lng/*" element={<SEOHead {...props} />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('SEOHead', () => {
  it('sets the page title with site name suffix', async () => {
    renderSEOHead({ title: 'Browse', description: 'Find books' });
    await waitFor(() => {
      expect(document.title).toBe('Browse | BookSwap');
    });
  });

  it('sets description meta tag', async () => {
    renderSEOHead({ title: 'Test', description: 'A test page' });
    await waitFor(() => {
      const meta = document.querySelector('meta[name="description"]');
      expect(meta).not.toBeNull();
      expect(meta!.getAttribute('content')).toBe('A test page');
    });
  });

  it('sets canonical link with language prefix', async () => {
    renderSEOHead({ title: 'Map', description: 'Map', path: '/map' }, '/en/map');
    await waitFor(() => {
      const link = document.querySelector('link[rel="canonical"]');
      expect(link).not.toBeNull();
      expect(link!.getAttribute('href')).toContain('/en/map');
    });
  });

  it('generates hreflang alternates for supported languages', async () => {
    renderSEOHead({ title: 'Home', description: 'Home', path: '/' });
    await waitFor(() => {
      const hreflangs = document.querySelectorAll('link[hreflang]');
      const langs = Array.from(hreflangs).map((l) => l.getAttribute('hreflang'));
      expect(langs).toContain('en');
      expect(langs).toContain('fr');
      expect(langs).toContain('nl');
      expect(langs).toContain('x-default');
    });
  });

  it('adds noindex meta when noIndex is true', async () => {
    renderSEOHead({ title: 'Login', description: 'Login', noIndex: true });
    await waitFor(() => {
      const robots = document.querySelector('meta[name="robots"]');
      expect(robots).not.toBeNull();
      expect(robots!.getAttribute('content')).toContain('noindex');
    });
  });

  it('does not add noindex meta by default', async () => {
    renderSEOHead({ title: 'Public', description: 'Public page' });
    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    });
    expect(document.querySelector('meta[name="robots"][content*="noindex"]')).toBeNull();
  });

  it('sets OG meta tags', async () => {
    renderSEOHead({ title: 'Browse', description: 'Find books', path: '/browse' });
    await waitFor(() => {
      expect(document.querySelector('meta[property="og:title"]')).not.toBeNull();
      expect(document.querySelector('meta[property="og:description"]')).not.toBeNull();
      expect(document.querySelector('meta[property="og:image"]')).not.toBeNull();
      expect(document.querySelector('meta[name="twitter:card"]')).not.toBeNull();
    });
  });
});
