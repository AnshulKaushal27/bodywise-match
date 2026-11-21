/**
 * Internal Link Crawler for Bodywise Match
 * Tests all internal links found on /, /how-it-works, /safeguards, /help
 */

async function crawlLinks() {
  const baseUrl = "http://localhost:3000";
  const seedPages = ["/", "/how-it-works", "/safeguards", "/help"];
  const visited = new Set<string>();
  const toCheck = new Set<string>(seedPages);
  const results: { url: string; status: number; ok: boolean; source?: string }[] = [];

  // 1. Collect all internal links from seed pages
  for (const pagePath of seedPages) {
    try {
      const res = await fetch(`${baseUrl}${pagePath}`);
      if (!res.ok) {
        results.push({ url: pagePath, status: res.status, ok: false, source: "seed" });
        continue;
      }
      results.push({ url: pagePath, status: res.status, ok: true, source: "seed" });
      const html = await res.text();

      // Extract href attributes
      const hrefRegex = /href=["'](\/[^"'#]*)/g;
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        const link = match[1];
        if (link && !link.startsWith("//") && !link.startsWith("/api/")) {
          toCheck.add(link);
        }
      }
    } catch (err: any) {
      results.push({ url: pagePath, status: 0, ok: false, source: `error: ${err.message}` });
    }
  }

  // 2. Check all discovered unique internal links
  for (const link of toCheck) {
    if (visited.has(link)) continue;
    visited.add(link);

    try {
      const res = await fetch(`${baseUrl}${link}`);
      results.push({
        url: link,
        status: res.status,
        ok: res.status < 400,
      });
    } catch (err: any) {
      results.push({
        url: link,
        status: 0,
        ok: false,
      });
    }
  }

  console.log("\n=== Internal Link Crawl Results ===");
  let hasFailures = false;
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    console.log(`${icon} [${r.status}] ${r.url}`);
    if (!r.ok) hasFailures = true;
  }
  console.log(`\nTotal Checked: ${results.length} | Failed: ${results.filter((r) => !r.ok).length}\n`);

  if (hasFailures) {
    process.exit(1);
  }
}

crawlLinks();
