// WCAG 2.1 Contrast Ratio Verification Script
// Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter luminance

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

function getContrast(fgHex: string, bgHex: string): number {
  const [r1, g1, b1] = hexToRgb(fgHex);
  const [r2, g2, b2] = hexToRgb(bgHex);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

interface Pair {
  name: string;
  fg: string;
  bg: string;
  required: number;
  isText: boolean;
}

const PAIRS: Pair[] = [
  // Text pairs (minimum 4.5:1 for normal text)
  { name: "Body text on Paper", fg: "#1B2A41", bg: "#F5F9FF", required: 4.5, isText: true },
  { name: "Body text on White Surface", fg: "#1B2A41", bg: "#FFFFFF", required: 4.5, isText: true },
  { name: "Muted text on White Surface", fg: "#5B6B82", bg: "#FFFFFF", required: 4.5, isText: true },
  { name: "Muted text on Paper", fg: "#5B6B82", bg: "#F5F9FF", required: 4.5, isText: true },
  { name: "Link / Primary on White", fg: "#1D4ED8", bg: "#FFFFFF", required: 4.5, isText: true },
  { name: "Link / Primary on Sky", fg: "#1D4ED8", bg: "#E3EEFC", required: 4.5, isText: true },
  { name: "White text on Primary Blue Button", fg: "#FFFFFF", bg: "#1D4ED8", required: 4.5, isText: true },
  { name: "White text on Primary Blue Hover", fg: "#FFFFFF", bg: "#1E40AF", required: 4.5, isText: true },
  { name: "Deep Navy text on Accent Sky Badge", fg: "#0B2447", bg: "#BBD9FF", required: 4.5, isText: true },
  { name: "Footer White text on Navy Footer", fg: "#FFFFFF", bg: "#0B2447", required: 4.5, isText: true },
  { name: "Footer Sky text on Navy Footer", fg: "#E3EEFC", bg: "#0B2447", required: 4.5, isText: true },
  { name: "Success text on Success background", fg: "#0B4A9E", bg: "#E3F0FF", required: 4.5, isText: true },
  { name: "Caution text on Caution Peach", fg: "#7A3B14", bg: "#FBE3D3", required: 4.5, isText: true },
  { name: "Error text on Error Red background", fg: "#8A1F1F", bg: "#FBE1E1", required: 4.5, isText: true },

  // Non-text pairs (minimum 3.0:1 for graphical UI objects & focus indicators)
  { name: "Focus Ring against White", fg: "#1D4ED8", bg: "#FFFFFF", required: 3.0, isText: false },
  { name: "Focus Ring against Paper", fg: "#1D4ED8", bg: "#F5F9FF", required: 3.0, isText: false },
  { name: "Border against Navy Deep", fg: "#D5E0EF", bg: "#0B2447", required: 3.0, isText: false },
];

function main() {
  console.log("=== WCAG 2.1 AA Contrast Ratio Verification ===");
  let failures = 0;

  for (const pair of PAIRS) {
    const ratio = Math.round(getContrast(pair.fg, pair.bg) * 100) / 100;
    const passed = ratio >= pair.required;
    const symbol = passed ? "✓ PASS" : "✗ FAIL";
    console.log(
      `${symbol}: ${pair.name} [${pair.fg} on ${pair.bg}] => ${ratio}:1 (required: ${pair.required}:1)`
    );
    if (!passed) failures++;
  }

  console.log("\n--- Official Be Bodywise Brand Comparison ---");
  const bebodywiseContrast = Math.round(getContrast("#FFFFFF", "#005995") * 100) / 100;
  const themeContrast = Math.round(getContrast("#FFFFFF", "#1D4ED8") * 100) / 100;
  console.log(`Theme Primary (#1D4ED8 on #FFFFFF): ${themeContrast}:1`);
  console.log(`Official Be Bodywise (#005995 on #FFFFFF): ${bebodywiseContrast}:1`);

  if (failures > 0) {
    console.error(`\nFAILED: ${failures} color contrast check(s) did not meet WCAG thresholds.`);
    process.exit(1);
  } else {
    console.log("\nALL CONTRAST CHECKS PASSED!");
  }
}

main();
