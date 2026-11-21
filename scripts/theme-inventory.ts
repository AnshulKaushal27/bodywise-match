import * as fs from "fs";
import * as path from "path";

const OLD_HEXES = [
  "#245345", "#17352E", "#DCE8D7", "#D9EE9B", "#F7F7F1",
  "#26332E", "#66756D", "#D8E1DA", "#1E473B", "#E3F1E0",
  "#1E5A2E", "#F4F6EE", "#B0D6A5", "#C4E8BD", "rgb(36, 83, 69)",
  "rgba(23, 53, 46", "rgba(36, 83, 69"
];

const GREEN_CLASSES = [
  "surface-sage", "accent-lime", "brand-evergreen", "brand-deep",
  "green-", "emerald-", "lime-", "teal-", "sage-"
];

interface Finding {
  file: string;
  category: string;
  hexes: string[];
  classes: string[];
}

function scanDir(dir: string, baseDir: string, findings: Finding[]) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (["node_modules", ".next", ".git", ".agent", "coverage", "dist"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, baseDir, findings);
    } else if (/\.(ts|tsx|js|jsx|css|html|json|md|svg)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, "utf8");
      const matchedHexes: string[] = [];
      const matchedClasses: string[] = [];

      for (const hex of OLD_HEXES) {
        if (content.toLowerCase().includes(hex.toLowerCase())) {
          matchedHexes.push(hex);
        }
      }

      for (const cls of GREEN_CLASSES) {
        // regex word or class boundary
        if (content.includes(cls)) {
          matchedClasses.push(cls);
        }
      }

      if (matchedHexes.length > 0 || matchedClasses.length > 0) {
        let category = "components/app";
        const rel = path.relative(baseDir, fullPath).replace(/\\/g, "/");
        if (rel.endsWith(".css")) category = "css";
        else if (rel.endsWith("config.ts") || rel.endsWith("config.js")) category = "config";
        else if (rel.startsWith("docs/") || rel.endsWith(".md")) category = "documentation";
        else if (rel.startsWith("e2e/") || rel.includes(".test.") || rel.includes(".spec.")) category = "test";
        else if (rel.startsWith("apps/web/public/")) category = "public-assets";
        else if (rel.endsWith(".svg")) category = "svg";

        findings.push({
          file: rel,
          category,
          hexes: Array.from(new Set(matchedHexes)),
          classes: Array.from(new Set(matchedClasses)),
        });
      }
    }
  }
}

function main() {
  const root = path.resolve(__dirname, "..");
  const findings: Finding[] = [];
  scanDir(root, root, findings);

  const hexFiles = findings.filter(f => f.hexes.length > 0 && !f.file.startsWith(".agent"));
  console.log("FILES_WITH_OLD_HEXES_COUNT:", hexFiles.length);
  console.log("FILES_WITH_OLD_HEXES:", JSON.stringify(hexFiles.map(f => ({ file: f.file, hexes: f.hexes })), null, 2));
}

main();
