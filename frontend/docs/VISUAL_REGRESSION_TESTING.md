# Visual Regression Testing

## Recommendation

For visual regression testing, we recommend **Chromatic** (https://www.chromatic.com/)
because the project already uses Storybook for the `tast-ui` component library.

### Why Chromatic?

- **Storybook-native**: Screenshots every story automatically — no extra test code
- **Diff review UI**: Side-by-side baseline vs. current comparison with pixel highlighting
- **CI integration**: GitHub Actions support via `chromatic` npm package
- **Free tier**: 5,000 snapshots/month for open-source projects

### Setup (when ready)

1. **Install**: `yarn add -D chromatic`

2. **Add to CI** (`.github/workflows/ci.yml`):
   ```yaml
   - name: Visual Regression (Chromatic)
     uses: chromaui/action@v11
     with:
       projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
       workingDir: packages/tast-ui
       buildScriptName: storybook:build
   ```

3. **Get a project token** from https://www.chromatic.com/ and add it as a
   GitHub Actions secret (`CHROMATIC_PROJECT_TOKEN`).

4. **Accept baselines** on first run, then Chromatic will flag any visual
   regressions on subsequent PRs.

### Alternative: Percy

If full-page screenshot testing (not just Storybook stories) is needed:

- **Percy** (https://percy.io/) — integrates with Playwright E2E tests
- Snapshots actual rendered pages in multiple viewports
- `yarn add -D @percy/cli @percy/playwright`
- Wrap existing Playwright tests with `await percySnapshot(page, 'Page Name')`

### Current Status

Visual regression testing is **not yet configured** — this is a low-priority
enhancement. The project's component library stability is currently ensured by:

- Unit tests with React Testing Library
- Accessibility audits via `jest-axe`
- Storybook stories for visual review during development
