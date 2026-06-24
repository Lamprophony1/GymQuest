import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const stylesPath = resolve(process.cwd(), 'src/styles.css');
const styles = readFileSync(stylesPath, 'utf8');

describe('Doodle Fit visual system', () => {
  test('uses the approved Clean Gym palette and type system', () => {
    expect(styles).toContain('--primary: #0f6f48');
    expect(styles).toContain('--fresh: #1aa866');
    expect(styles).toContain('--accent: #f4ff5f');
    expect(styles).toContain('--aqua: #79e7ff');
    expect(styles).toContain('--danger: #ff6f61');
    expect(styles).toContain('Space Grotesk');
    expect(styles).toContain('Nunito');
  });

  test('does not keep the old Sega arcade identity as the app skin', () => {
    expect(styles).not.toContain('VT323');
    expect(styles).not.toContain('#4503ff');
    expect(styles).not.toContain('--shadow-ring');
  });

  test('uses restrained TypeUI-style medallions for coins and clear power board hierarchy', () => {
    expect(styles).toContain('--coin-gold: #c47f00');
    expect(styles).toContain('--coin-gold-soft: #fff0bd');
    expect(styles).toContain('.coin-chip--commit .coin-mark');
    expect(styles).toContain('.status-card h3');
    expect(styles).toContain('.status-card p');
    expect(styles).not.toContain('.game-icon--flaming-heart');
    expect(styles).not.toContain('.game-coin');
  });

  test('uses a Doodle scorebar treatment for the compact app header', () => {
    expect(styles).toContain('.app-header::before');
    expect(styles).toContain('position: fixed');
    expect(styles).toContain('.app-header__brand-mark');
    expect(styles).toContain('.app-header__brand-image');
    expect(styles).toContain('.quest-icon');
    expect(styles).toContain('.app-header__title-row');
    expect(styles).toContain('.app-header__meta-pill');
    expect(styles).toContain('background: var(--lime-soft)');
    expect(styles).toContain('.app-header--compact .app-header__brand-mark');
    expect(styles).toContain('transform: translateY');
  });

  test('keeps the login brand mark aligned with the app header identity', () => {
    expect(styles).toContain('.login-card__brand-image');
    expect(styles).toContain('.app-header__brand-image');
    expect(styles).toContain('background: transparent');
    expect(styles).not.toContain('background: linear-gradient(145deg, var(--accent), var(--aqua))');
  });

  test('keeps Quest Sticker Totems compact on login while preserving app brand sizes', () => {
    expect(styles).toContain('min-height: 100svh');
    expect(styles).toMatch(/\.login-card__brand-image\s*{\s*width: 112px;\s*height: 112px;/);
    expect(styles).toContain('--header-brand-size: clamp(84px, 21vw, 96px)');
    expect(styles).toContain('--header-brand-size: clamp(66px, 16vw, 72px)');
    expect(styles).toMatch(/\.icon-button\.profile-menu__button--avatar\s*{\s*width: 78px;\s*height: 78px;/);
    expect(styles).toMatch(/\.app-header--compact \.icon-button\.profile-menu__button--avatar\s*{\s*width: 64px;\s*height: 64px;/);
    expect(styles).toMatch(/\.streak-score \.icon-frame--asset\s*{\s*width: 64px;\s*height: 64px;/);
    expect(styles).toMatch(/\.icon-frame--asset\s*{\s*width: 72px;\s*height: 72px;/);
    expect(styles).toMatch(/\.coin-mark--asset\s*{\s*width: 50px;\s*height: 50px;/);
    expect(styles).toMatch(/\.calendar-entry--coin\s*{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 46px;/);
    expect(styles).not.toMatch(/\.calendar-entry--coin\s*{[\s\S]*?min-height: 94px;/);
    expect(styles).toMatch(/\.calendar-entry__coin-icon\s*{[\s\S]*?justify-self: center;[\s\S]*?width: 46px;\s*height: 46px;/);
    expect(styles).toMatch(/\.badge--streak \.quest-icon\s*{\s*width: 1\.875rem;\s*height: 1\.875rem;/);
  });

  test('keeps mobile date-time inputs inside form cards', () => {
    expect(styles).toContain('.arcade-form input[type="datetime-local"]');
    expect(styles).toContain('max-inline-size: 100%');
    expect(styles).toContain('::-webkit-date-and-time-value');
  });

  test('keeps weekly calendar scroll affordances dimensionally stable', () => {
    const yScrolledRule = styles.match(/\.admin-calendar__scroller--y-scrolled \.admin-calendar-table thead th\s*{(?<body>[\s\S]*?)}/);
    expect(yScrolledRule?.groups?.body).toBeDefined();
    expect(yScrolledRule?.groups?.body).not.toMatch(/padding|font-size|display/);
    expect(styles).not.toMatch(/\.admin-calendar__scroller--y-scrolled \.admin-calendar-table thead th small\s*{[\s\S]*?display:\s*none/);
  });

  test('anchors the mobile bottom nav to the viewport edge with safe-area padding', () => {
    expect(styles).toContain('--safe-area-bottom: env(safe-area-inset-bottom, 0px)');
    expect(styles).toContain('padding: 8px 8px calc(8px + var(--safe-area-bottom))');
    expect(styles).toContain('transform: translateX(-50%)');
  });
});
