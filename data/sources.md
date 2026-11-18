# Data Sources & Rules of Access Record

## 1. Confirmed Official Domain
- **Official Store Domain:** `https://bebodywise.com`
- **Confirmation Method:** Verified via live browser navigation and inspection on 2026-11-18.
- **Entity & Branding:** Be Bodywise (Mosaic Wellness Pvt. Ltd.), telehealth and personal care products for women.
- **Sitemap Location:** `https://bebodywise.com/sitemap.xml`

## 2. Robots.txt Directives & Access Policies
Fetched directly from `https://bebodywise.com/robots.txt`:
```
User-agent: *
Disallow: /habit/*
Disallow: /status/*
Disallow: /orderdetails/*
Sitemap: https://bebodywise.com/sitemap.xml

User-agent: AdsBot-Google
Allow: /

User-agent: Googlebot
Allow: /

User-agent: SiteCheckerBotCrawler
Allow: /

User-agent: OAI-SearchBot
Disallow:
```

### Analysis & Etiquette Rules
- **Catalog & Product Access:** Neither `/shop/*` nor `/product/*` is disallowed. Standard crawlers are permitted to access catalog, category, and product detail pages.
- **Restricted Endpoints:** Only private user tracking and account/order status paths (`/habit/*`, `/status/*`, `/orderdetails/*`) are disallowed.
- **Rate Limiting:** A politeness policy of at most 1 request every 2 seconds (minimum 2000ms delay between consecutive requests) is strictly enforced.
- **User-Agent:** Polite, transparent User-Agent: `BodywiseMatchAuditor/1.0 (+https://github.com/Mosaic-Fellowship/bodywise-match)`
- **No Paywalls or Login Bypasses:** No login gates, paywalls, or bot checks are touched or bypassed. If any page requires authentication, extraction immediately stops.
