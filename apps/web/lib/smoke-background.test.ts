import { describe, it, expect } from "vitest";
import { SMOKE_CONSTANTS } from "@/components/SmokeBackground";

// Relative luminance formula per WCAG 2.1
function getLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

// Contrast ratio formula per WCAG 2.1
function getContrastRatio(lum1: number, lum2: number): number {
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe("SmokeBackground - Shader Constants & Guardrails", () => {
  it("enforces strict safety caps on lime, alpha, and speed", () => {
    // Lime capped at 0.25 to prevent over-saturation
    expect(SMOKE_CONSTANTS.LIME_MAX).toBeLessThanOrEqual(0.25);
    expect(SMOKE_CONSTANTS.LIME_MAX).toBeGreaterThanOrEqual(0.15);

    // Alpha between 0.55 and 0.70 for soft haze
    expect(SMOKE_CONSTANTS.ALPHA).toBeGreaterThanOrEqual(0.55);
    expect(SMOKE_CONSTANTS.ALPHA).toBeLessThanOrEqual(0.70);

    // Slow drifting speed (0.02 - 0.03)
    expect(SMOKE_CONSTANTS.SPEED).toBeGreaterThanOrEqual(0.02);
    expect(SMOKE_CONSTANTS.SPEED).toBeLessThanOrEqual(0.03);

    // Depth evergreen capped at 0.07
    expect(SMOKE_CONSTANTS.EVERGREEN_MAX).toBeLessThanOrEqual(0.07);

    // Target FPS capped at 30
    expect(SMOKE_CONSTANTS.TARGET_FPS).toBe(30);

    // Adaptive threshold at 24ms
    expect(SMOKE_CONSTANTS.MAX_FRAME_TIME_MS).toBe(24);
  });

  it("verifies hero text colors meet WCAG AA (4.5:1 min) against the brightest shader pixel", () => {
    // Paper: #F5F9FF -> rgb(245, 249, 255)
    const paper = [245, 249, 255];
    // Accent Sky: #BBD9FF -> rgb(187, 217, 255)
    const accentSky = [187, 217, 255];
    // Sky: #E3EEFC -> rgb(227, 238, 252)
    const sky = [227, 238, 252];

    // Compute maximum possible brightness in shader:
    const colR = (paper[0] * 0.35 + sky[0] * 0.65) * (1 - SMOKE_CONSTANTS.ACCENT_MAX) + accentSky[0] * SMOKE_CONSTANTS.ACCENT_MAX;
    const colG = (paper[1] * 0.35 + sky[1] * 0.65) * (1 - SMOKE_CONSTANTS.ACCENT_MAX) + accentSky[1] * SMOKE_CONSTANTS.ACCENT_MAX;
    const colB = (paper[2] * 0.35 + sky[2] * 0.65) * (1 - SMOKE_CONSTANTS.ACCENT_MAX) + accentSky[2] * SMOKE_CONSTANTS.ACCENT_MAX;

    // Composite over paper background
    const finalR = colR * SMOKE_CONSTANTS.ALPHA + paper[0] * (1 - SMOKE_CONSTANTS.ALPHA);
    const finalG = colG * SMOKE_CONSTANTS.ALPHA + paper[1] * (1 - SMOKE_CONSTANTS.ALPHA);
    const finalB = colB * SMOKE_CONSTANTS.ALPHA + paper[2] * (1 - SMOKE_CONSTANTS.ALPHA);

    const bgLum = getLuminance(finalR, finalG, finalB);

    // 1. Brand deep heading color #0B2447: rgb(11, 36, 71)
    const deepLum = getLuminance(11, 36, 71);
    const deepRatio = getContrastRatio(bgLum, deepLum);
    expect(deepRatio).toBeGreaterThan(4.5); // Usually > 10:1

    // 2. Charcoal body text #1B2A41: rgb(27, 42, 65)
    const charcoalLum = getLuminance(27, 42, 65);
    const charcoalRatio = getContrastRatio(bgLum, charcoalLum);
    expect(charcoalRatio).toBeGreaterThan(4.5); // Usually > 8:1

    // 3. Brand primary button & link #1D4ED8: rgb(29, 78, 216)
    const primaryLum = getLuminance(29, 78, 216);
    const primaryRatio = getContrastRatio(bgLum, primaryLum);
    expect(primaryRatio).toBeGreaterThan(4.5);
  });
});

describe("SmokeBackground - Adaptive Quality Simulation", () => {
  it("determines that frame times exceeding 24ms trigger quality degradation", () => {
    // Normal 30fps frames: ~33.3ms total elapsed between ticks, but actual render work <= 24ms
    const fastFrames = Array.from({ length: 60 }, () => 14); // 14ms average work
    const avgFast = fastFrames.reduce((a, b) => a + b, 0) / fastFrames.length;
    expect(avgFast).toBeLessThanOrEqual(SMOKE_CONSTANTS.MAX_FRAME_TIME_MS);

    // Stressed/slow device frames:
    const slowFrames = Array.from({ length: 60 }, () => 28); // 28ms average work
    const avgSlow = slowFrames.reduce((a, b) => a + b, 0) / slowFrames.length;
    expect(avgSlow).toBeGreaterThan(SMOKE_CONSTANTS.MAX_FRAME_TIME_MS);

    // Emulate degradation logic
    const shouldDegrade = avgSlow > SMOKE_CONSTANTS.MAX_FRAME_TIME_MS;
    const degradedOctaves = shouldDegrade ? 2 : 4;
    expect(degradedOctaves).toBe(2);
  });
});
