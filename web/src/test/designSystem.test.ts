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
});
