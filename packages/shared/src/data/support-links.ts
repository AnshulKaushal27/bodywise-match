/**
 * Official Be Bodywise Support Channels & Verification Metadata
 * Verified from official store endpoints (bebodywise.com/contactus, refunds-policy) on 2026-11-18.
 *
 * NON-NEGOTIABLE HONESTY RULES:
 * 1. We NEVER claim live connection to support ticket queues or courier systems.
 * 2. Every channel states source and last_checked date.
 * 3. All contact endpoints are authentic and published by Be Bodywise (Mosaic Wellness Pvt. Ltd.).
 */

export interface SupportChannel {
  id: string;
  name: string;
  description: string;
  type: "email" | "chat" | "portal" | "phone";
  target_url: string;
  source: string;
  last_checked: string;
  recommended_for: string;
}

export const OFFICIAL_SUPPORT_CHANNELS: SupportChannel[] = [
  {
    id: "email-support",
    name: "Official Email Support",
    description: "Best for sharing photos of damaged parcels, batch codes, or written escalations.",
    type: "email",
    target_url: "mailto:support@bebodywise.com",
    source: "https://bebodywise.com/contactus",
    last_checked: "2026-11-18",
    recommended_for: "Damaged orders, product reactions, billing disputes",
  },
  {
    id: "phone-support",
    name: "Official Support Helpline",
    description: "Direct representative assistance (Mon to Sat 9 AM to 6 PM IST).",
    type: "phone",
    target_url: "tel:+918128688128",
    source: "https://bebodywise.com/contactus",
    last_checked: "2026-11-18",
    recommended_for: "Urgent delivery address corrections, failed delivery attempts",
  },
  {
    id: "whatsapp-support",
    name: "Official WhatsApp Support",
    description: "Quick updates and chat with customer care on WhatsApp.",
    type: "chat",
    target_url: "https://wa.me/918128688128",
    source: "https://bebodywise.com/contactus",
    last_checked: "2026-11-18",
    recommended_for: "Tracking inquiries, delivery reschedule",
  },
  {
    id: "contact-portal",
    name: "Customer Contact Portal",
    description: "Web contact page on the official Be Bodywise platform.",
    type: "portal",
    target_url: "https://bebodywise.com/contactus",
    source: "https://bebodywise.com/contactus",
    last_checked: "2026-11-18",
    recommended_for: "General inquiries and official app downloads",
  },
  {
    id: "refunds-policy",
    name: "Official Returns & Refunds Policy",
    description: "Published terms for returns, transit damage claims, and refund processing.",
    type: "portal",
    target_url: "https://bebodywise.com/refunds-policy",
    source: "https://bebodywise.com/refunds-policy",
    last_checked: "2026-11-18",
    recommended_for: "Return window eligibility and refund guidelines",
  },
];
