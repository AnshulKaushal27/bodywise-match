/**
 * Official Support Channels & Verification Metadata
 *
 * NON-NEGOTIABLE HONESTY RULES:
 * 1. We NEVER claim live connection to support ticket queues or courier systems.
 * 2. Every channel must state source and last_checked date.
 * 3. Build-time validation warning included below.
 *
 * TODO: Verify support channels and URLs at build time against official bebodywise.com release endpoints.
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
    source: "Be Bodywise Official Contact Page",
    last_checked: "2026-11-01",
    recommended_for: "Damaged orders, product reactions, billing disputes",
  },
  {
    id: "whatsapp-support",
    name: "Official WhatsApp Support",
    description: "Quick updates on parcel delivery reschedule requests directly with brand support.",
    type: "chat",
    target_url: "https://wa.me/917997999800",
    source: "Be Bodywise Official Help Footer",
    last_checked: "2026-11-01",
    recommended_for: "Delivery address corrections, failed delivery attempts",
  },
  {
    id: "support-portal",
    name: "Customer Care Ticket Portal",
    description: "Web form to log an issue ticket with your registered order mobile number.",
    type: "portal",
    target_url: "https://bebodywise.com/contact-us",
    source: "Be Bodywise Customer Care Portal",
    last_checked: "2026-11-01",
    recommended_for: "Tracking requests, formal ticket escalation",
  },
];
