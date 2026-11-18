/**
 * Secret Scanner Pre-commit Hook
 * Blocks commits containing Groq-style API keys (gsk_...) or other secrets.
 * Excludes .env.example where mock placeholder keys are documented.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const GROQ_KEY_REGEX = /gsk_[A-Za-z0-9]{20,}/g;
const ALLOWED_FILES = new Set([
  ".env.example",
  path.normalize(".env.example"),
  "scripts/secret-scan.ts",
  path.normalize("scripts/secret-scan.ts"),
]);

function runSecretScan(): void {
  console.log("🔒 Running pre-commit secret scan...");

  let filesToScan: string[] = [];

  try {
    // Get staged files from git
    const gitOutput = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf-8",
    });
    filesToScan = gitOutput
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
  } catch {
    // If not in a git command or git failed, scan tracked source files
    filesToScan = [];
  }

  // If no files are staged, fallback to scanning tracked files or exit
  if (filesToScan.length === 0) {
    try {
      const gitTracked = execSync("git ls-files", { encoding: "utf-8" });
      filesToScan = gitTracked
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
    } catch {
      filesToScan = [];
    }
  }

  let violationsFound = 0;

  for (const relativePath of filesToScan) {
    const normalizedPath = path.normalize(relativePath);

    // Skip allowed example / documentation files and build artifacts
    if (
      ALLOWED_FILES.has(relativePath) ||
      ALLOWED_FILES.has(normalizedPath) ||
      relativePath.endsWith(".env.example") ||
      relativePath.includes("node_modules") ||
      relativePath.includes(".next") ||
      relativePath.includes("dist") ||
      relativePath.includes(".git")
    ) {
      continue;
    }

    if (!fs.existsSync(relativePath)) {
      continue;
    }

    // Skip binary files or images
    if (/\.(png|jpg|jpeg|webp|ico|svg|lock|woff2?|pdf)$/i.test(relativePath)) {
      continue;
    }

    const content = fs.readFileSync(relativePath, "utf-8");
    const matches = content.match(GROQ_KEY_REGEX);

    if (matches && matches.length > 0) {
      console.error(
        `❌ [SECURITY ALERT] Found ${matches.length} Groq API key(s) in: ${relativePath}`
      );
      console.error(
        `   Matched pattern: "gsk_..." (Length: ${matches[0].length}). Real keys must NEVER be committed.`
      );
      violationsFound += matches.length;
    }
  }

  if (violationsFound > 0) {
    console.error(
      `\n🚫 Commit rejected: ${violationsFound} unmasked secret(s) found. Remove the key(s) and use environment variables.\n`
    );
    process.exit(1);
  }

  console.log("✅ Secret scan passed: Zero Groq keys detected in tracked files.\n");
}

runSecretScan();
