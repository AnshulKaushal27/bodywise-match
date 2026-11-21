import * as fs from "fs";
import * as path from "path";

// Old palette hex strings (case-insensitive)
const OLD_HEXES = [
  "#245345", "#17352E", "#DCE8D7", "#D9EE9B", "#F7F7F1",
  "#26332E", "#66756D", "#D8E1DA", "#1E473B", "#E3F1E0",
  "#1E5A2E", "#F4F6EE", "#B0D6A5", "#C4E8BD"
];

// Tailwind green-family color classes that should no longer exist in components/pages
const DISALLOWED_CLASSES = [
  /\b(emerald|lime|teal|olive)-[1-9]00\b/,
  /\bgreen-[1-9]00\b/,
  /\bbg-emerald-\b/,
  /\btext-emerald-\b/,
  /\bbg-lime-\b/,
  /\btext-lime-\b/,
  /\btext-green-\b/,
  /\bbg-green-\b/,
];

interface Finding {
  file: string;
  line: number;
  match: string;
  snippet: string;
}

function scanFile(filePath: string, relativePath: string, findings: Finding[]) {
  // Allowlist explicit exceptions
  if (
    relativePath.includes("node_modules") ||
    relativePath.includes(".git") ||
    relativePath.includes(".agent") ||
    relativePath.includes("theme-scan.ts") ||
    relativePath.includes("theme-inventory.ts") ||
    relativePath.endsWith(".webp") ||
    relativePath.endsWith(".png") ||
    relativePath.endsWith(".jpg") ||
    relativePath.endsWith(".ico")
  ) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check old hexes
    for (const hex of OLD_HEXES) {
      if (line.toLowerCase().includes(hex.toLowerCase())) {
        findings.push({
          file: relativePath,
          line: i + 1,
          match: hex,
          snippet: line.trim(),
        });
      }
    }

    // Check disallowed Tailwind green/emerald/lime classes
    for (const regex of DISALLOWED_CLASSES) {
      const match = line.match(regex);
      if (match) {
        findings.push({
          file: relativePath,
          line: i + 1,
          match: match[0],
          snippet: line.trim(),
        });
      }
    }
  }
}

function walkDir(dir: string, baseDir: string, findings: Finding[]) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".agent", "dist", "coverage"].includes(entry.name)) {
        continue;
      }
      walkDir(full, baseDir, findings);
    } else {
      scanFile(full, rel, findings);
    }
  }
}

function main() {
  console.log("=== Scanning for Leftover Old Green / Lime Color Literals ===");
  const root = path.resolve(__dirname, "..");
  const findings: Finding[] = [];

  // Scan apps/web, packages, docs
  walkDir(path.join(root, "apps/web/app"), root, findings);
  walkDir(path.join(root, "apps/web/components"), root, findings);
  walkDir(path.join(root, "apps/web/lib"), root, findings);
  walkDir(path.join(root, "apps/web/public"), root, findings);
  walkDir(path.join(root, "packages/shared"), root, findings);

  console.log(`Scanned source directories. Findings count: ${findings.length}`);

  if (findings.length > 0) {
    console.error(`\nFAILED: Found ${findings.length} leftover old palette color references:`);
    for (const f of findings) {
      console.error(`  ${f.file}:${f.line} [${f.match}] -> ${f.snippet}`);
    }
    process.exit(1);
  } else {
    console.log("SUCCESS: Zero old green / lime color literals found across application source!");
  }
}

main();
