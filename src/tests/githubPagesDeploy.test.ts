import fs from 'node:fs';

describe('GitHub Pages deployment contract', () => {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  const workflow = fs.readFileSync('.github/workflows/publicar-pages.yml', 'utf8');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };

  it('uses the repository path only for production builds', () => {
    expect(viteConfig).toContain("export const GITHUB_PAGES_BASE = '/dsai-ap1-2Drogue/'");
    expect(viteConfig).toContain("base: command === 'build' || isPreview ? GITHUB_PAGES_BASE : '/'");
    expect(viteConfig).toContain("input: path.resolve(__dirname, 'src/index.html')");
  });

  it('runs automatically and manually without actor restrictions', () => {
    expect(workflow).toMatch(/push:\s*\r?\n\s*branches:\s*\r?\n\s*- main/);
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).not.toMatch(/github\.actor|if:\s*.*actor/);
  });

  it('serializes deployments and deploys only after an approved build artifact', () => {
    expect(workflow).toMatch(/concurrency:[\s\S]*group: pages[\s\S]*cancel-in-progress: true/);
    expect(workflow).toMatch(/compilar:[\s\S]*npm ci[\s\S]*npm run check:gates[\s\S]*npm test -- --runInBand[\s\S]*npm run build[\s\S]*npm run validate:pages[\s\S]*upload-pages-artifact@v4/);
    expect(workflow).toMatch(/publicar:[\s\S]*needs: compilar[\s\S]*environment:[\s\S]*name: github-pages[\s\S]*deploy-pages@v4/);
  });

  it('keeps an explicit post-build asset validation command', () => {
    expect(packageJson.scripts['validate:pages']).toBe('node scripts/validate-pages-build.mjs');
  });
});
