export interface HelpChecklistItem {
  id: string;
  label: string;
}

export interface HelpFieldDefinition {
  id: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "number";
  helperText?: string;
}

export interface HelpIssueConfig {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  checklist: HelpChecklistItem[];
  fields: HelpFieldDefinition[];
  caution: string;
  generateTemplate: (values: Record<string, string>, checkedLabels?: string[]) => string;
}

function formatChecklist(checkedLabels?: string[]): string {
  if (!checkedLabels || checkedLabels.length === 0) {
    return "- [No checklist items selected yet]";
  }
  return checkedLabels.map((l) => `- ${l}`).join("\n");
}

export const HELP_ISSUES: HelpIssueConfig[] = [
  // 1. Delayed delivery
  {
    id: "delayed-delivery",
    slug: "delayed-delivery",
    title: "Delayed delivery",
    shortDescription: "Parcel has not arrived by the expected delivery date or courier tracking status is stagnant.",
    checklist: [
      { id: "c1", label: "Checked tracking link in official courier SMS or email (AWB number)" },
      { id: "c2", label: "Verified delivery address and phone number on original order receipt" },
      { id: "c3", label: "Checked with building security, front desk, or household members" },
      { id: "c4", label: "Confirmed order date is at least 3-5 business days ago" },
    ],
    fields: [
      { id: "customer_name", label: "Your Full Name", placeholder: "e.g. Priya Sharma" },
      { id: "customer_phone", label: "Your Phone Number", placeholder: "e.g. +91 98765 43210" },
      { id: "order_id", label: "Order ID", placeholder: "e.g. BW-1094821" },
      { id: "order_date", label: "Order Date", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "expected_date", label: "Promised / Expected Delivery Date", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "courier_name", label: "Courier Partner (if known)", placeholder: "e.g. Delhivery, Bluedart" },
      { id: "awb_number", label: "Tracking / AWB Number", placeholder: "e.g. 14920381029" },
    ],
    caution: "We cannot check live courier databases or logistics manifests. This template compiles your tracking identifiers for official customer care escalation.",
    generateTemplate: (v, checked) => `Subject: Delivery Delay Inquiry - Order ${v.order_id || "[Order ID]"}

Dear Be Bodywise Customer Care,

I am writing regarding my recent order which has not arrived within the promised delivery window.

Order Details:
- Order ID: ${v.order_id || "[Not provided]"}
- Order Date: ${v.order_date || "[Not provided]"}
- Expected Delivery Date: ${v.expected_date || "[Not provided]"}
- Courier Partner: ${v.courier_name || "[Not provided]"}
- AWB / Tracking Number: ${v.awb_number || "[Not provided]"}

Verification Steps Completed:
${formatChecklist(checked)}

Could you please check with the courier team and provide an updated delivery status?

Thank you,
${v.customer_name || "[Your Name]"}
${v.customer_phone || "[Your Phone Number]"}`,
  },

  // 2. Failed delivery attempt
  {
    id: "failed-delivery",
    slug: "failed-delivery",
    title: "Failed delivery attempt",
    shortDescription: "Courier marked delivery as 'attempted' or 'customer unavailable' without contacting you.",
    checklist: [
      { id: "c1", label: "Confirmed phone was reachable and not in Do-Not-Disturb mode during working hours" },
      { id: "c2", label: "Verified delivery address, pincode, and prominent landmark" },
      { id: "c3", label: "Checked courier tracking page for automatic re-attempt schedule" },
    ],
    fields: [
      { id: "customer_name", label: "Your Full Name", placeholder: "e.g. Priya Sharma" },
      { id: "customer_phone", label: "Your Phone Number", placeholder: "e.g. +91 98765 43210" },
      { id: "order_id", label: "Order ID", placeholder: "e.g. BW-1094821" },
      { id: "awb_number", label: "Tracking / AWB Number", placeholder: "e.g. 14920381029" },
      { id: "attempt_date_time", label: "Date & Time Marked as Attempted", placeholder: "e.g. 18 Nov, 2:30 PM" },
      { id: "alternate_phone", label: "Alternate Contact Number", placeholder: "e.g. 98XXXXXXXX" },
      { id: "landmark_instructions", label: "Landmark / Delivery Instructions", placeholder: "e.g. Opposite City Park, 2nd floor" },
    ],
    caution: "Courier partners typically attempt delivery up to 3 times before returning to origin (RTO). Contacting official support promptly helps prevent return.",
    generateTemplate: (v, checked) => `Subject: Failed Delivery Attempt Assistance - Order ${v.order_id || "[Order ID]"}

Dear Be Bodywise Support Team,

My tracking status indicates a delivery attempt was made for Order ${v.order_id || "[Order ID]"} (AWB: ${v.awb_number || "[AWB]"}) on ${v.attempt_date_time || "[Date/Time]"}, but no courier contacted me.

Delivery Coordinates:
- Primary Phone: ${v.customer_phone || "[Your Phone Number]"}
- Alternate Phone: ${v.alternate_phone || "[Not provided]"}
- Delivery Address & Landmark: ${v.landmark_instructions || "[Provide address landmark]"}

Verification Steps Completed:
${formatChecklist(checked)}

I am available to receive the delivery. Please prevent this parcel from being marked for return (RTO).

Thank you,
${v.customer_name || "[Your Name]"}
${v.customer_phone || "[Your Phone Number]"}`,
  },

  // 3. Damaged or leaking package
  {
    id: "damaged-package",
    slug: "damaged-package",
    title: "Damaged or leaking package",
    shortDescription: "Package arrived with crushed outer packaging, broken cap, or leaking liquid.",
    checklist: [
      { id: "c1", label: "Captured clear photographs of outer cardboard box and courier label" },
      { id: "c2", label: "Captured photographs of leaking bottle, broken pump, or ruptured seal" },
      { id: "c3", label: "Located 6-10 character batch code printed on the bottom of the bottle/carton" },
      { id: "c4", label: "Retained original shipping packaging until support confirms resolution" },
    ],
    fields: [
      { id: "customer_name", label: "Your Full Name", placeholder: "e.g. Priya Sharma" },
      { id: "customer_phone", label: "Your Phone Number", placeholder: "e.g. +91 98765 43210" },
      { id: "order_id", label: "Order ID", placeholder: "e.g. BW-1094821" },
      { id: "delivery_date", label: "Delivery Date", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "damaged_product", label: "Damaged Product Name", placeholder: "e.g. 1% Salicylic Acid Body Wash" },
      { id: "batch_number", label: "Batch Code (from bottle bottom)", placeholder: "e.g. B26-104A" },
      { id: "leak_details", label: "Description of Damage", placeholder: "e.g. Pump broken in transit, half of bottle leaked into box" },
    ],
    caution: "Safety Notice: Never apply liquid from a shattered bottle. We cannot label a batch counterfeit, fake, or expired from photos. Batch codes must be verified by official manufacturer quality control.",
    generateTemplate: (v, checked) => `Subject: Damaged / Leaking Product Report - Order ${v.order_id || "[Order ID]"}

Dear Be Bodywise Quality Care,

I received my delivery on ${v.delivery_date || "[Date]"} for Order ${v.order_id || "[Order ID]"}, but the product arrived damaged.

Damage Details:
- Affected Product: ${v.damaged_product || "[Product Name]"}
- Packaging Batch Code: ${v.batch_number || "[Batch Number on bottle]"}
- Damage Observed: ${v.leak_details || "[Describe damage/leakage]"}

Verification Steps Completed:
${formatChecklist(checked)}

I have attached high-resolution photos showing:
1. The outer shipping box and courier label
2. The damaged bottle seal/cap
3. The printed batch code

Please advise on replacement or credit arrangements as the product cannot be used safely.

Thank you,
${v.customer_name || "[Your Name]"}
${v.customer_phone || "[Your Phone Number]"}`,
  },

  // 4. Near-expiry concern
  {
    id: "near-expiry",
    slug: "near-expiry",
    title: "Near-expiry concern",
    shortDescription: "Received a product with an expiration date closer than expected.",
    checklist: [
      { id: "c1", label: "Located manufacturing date (MFG) and expiry date (EXP) on packaging" },
      { id: "c2", label: "Estimated product usage duration (e.g. 200ml wash lasts ~30-45 days of daily use)" },
      { id: "c3", label: "Calculated remaining months before expiration" },
    ],
    fields: [
      { id: "customer_name", label: "Your Full Name", placeholder: "e.g. Priya Sharma" },
      { id: "customer_phone", label: "Your Phone Number", placeholder: "e.g. +91 98765 43210" },
      { id: "order_id", label: "Order ID", placeholder: "e.g. BW-1094821" },
      { id: "product_name", label: "Product Name", placeholder: "e.g. 4% AHA BHA Underarm Roll-On" },
      { id: "batch_number", label: "Batch Number", placeholder: "e.g. B26-092" },
      { id: "mfg_date", label: "Printed MFG Date", placeholder: "e.g. 11/2025" },
      { id: "exp_date", label: "Printed EXP Date", placeholder: "e.g. 01/2027" },
    ],
    caution: "We cannot confirm batch validity or chemical longevity from photos. Manufacturer guidelines generally maintain products within the stated EXP date when stored as directed.",
    generateTemplate: (v, checked) => `Subject: Expiration Date Clarification - Order ${v.order_id || "[Order ID]"}

Dear Be Bodywise Customer Care,

I received Order ${v.order_id || "[Order ID]"} and have a concern regarding the shelf life remaining on the delivered product.

Product Information:
- Item: ${v.product_name || "[Product Name]"}
- Batch Number: ${v.batch_number || "[Batch Number]"}
- Printed Manufacturing Date (MFG): ${v.mfg_date || "[MFG Date]"}
- Printed Expiry Date (EXP): ${v.exp_date || "[EXP Date]"}

Verification Steps Completed:
${formatChecklist(checked)}

Given the volume of this product, I would like to verify whether this shelf life meets Be Bodywise's standard freshness window, and whether a replacement from a more recent batch is available.

Thank you,
${v.customer_name || "[Your Name]"}
${v.customer_phone || "[Your Phone Number]"}`,
  },

  // 5. Payment uncertainty
  {
    id: "payment-uncertainty",
    slug: "payment-uncertainty",
    title: "Payment uncertainty",
    shortDescription: "Money was debited from your bank or wallet, but order status is unclear or unconfirmed.",
    checklist: [
      { id: "c1", label: "Checked bank SMS / UPI app for bank transaction reference (UTR / RRN number)" },
      { id: "c2", label: "Checked spam folder for official order confirmation email" },
      { id: "c3", label: "Waited 15-30 minutes for payment gateway webhook reconciliation" },
    ],
    fields: [
      { id: "customer_name", label: "Your Full Name", placeholder: "e.g. Priya Sharma" },
      { id: "customer_phone", label: "Your Phone Number", placeholder: "e.g. +91 98765 43210" },
      { id: "amount_charged", label: "Total Amount Debited (INR)", placeholder: "e.g. 549" },
      { id: "wallet_credit_used", label: "Wallet Credit Used (if any)", placeholder: "e.g. 50 (or 0)" },
      { id: "discount_coupon", label: "Coupon Code Applied (if any)", placeholder: "e.g. GLOW10" },
      { id: "payment_method", label: "Payment Mode (UPI / Card / Netbanking)", placeholder: "e.g. Google Pay UPI" },
      { id: "bank_ref_utr", label: "Bank Reference / UTR Number", placeholder: "e.g. UTR-491028301928" },
      { id: "transaction_date_time", label: "Transaction Date & Time", placeholder: "e.g. 18 Nov, 11:15 AM" },
      { id: "order_confirmation_status", label: "Order Status Observed", placeholder: "e.g. Screen showed error, money deducted" },
    ],
    caution: "We do not have access to payment gateway logs or merchant banking systems. Banking gateways automatically refund un-captured deductions within 3-5 business days.",
    generateTemplate: (v, checked) => `Subject: Payment Deducted - Order Confirmation Query

Dear Be Bodywise Billing Support,

An amount was debited from my account, but I have not received an official order confirmation receipt.

Payment Summary (User-reported values):
- Amount Charged: ₹${v.amount_charged || "[Amount]"}
- Wallet Credit Applied: ₹${v.wallet_credit_used || "0"}
- Discount Code: ${v.discount_coupon || "None"}
- Payment Mode: ${v.payment_method || "[Payment Mode]"}
- Bank Reference / UTR / Transaction ID: ${v.bank_ref_utr || "[UTR Number]"}
- Transaction Timestamp: ${v.transaction_date_time || "[Date/Time]"}
- Observed Status: ${v.order_confirmation_status || "Payment successful, no order ID"}

Verification Steps Completed:
${formatChecklist(checked)}

Could you please verify if this transaction was captured and matched to an Order ID, or if it will be automatically refunded by the gateway?

Thank you,
${v.customer_name || "[Your Name]"}
${v.customer_phone || "[Your Phone Number]"}`,
  },

  // 6. Unresolved support request
  {
    id: "unresolved-support",
    slug: "unresolved-support",
    title: "Unresolved support request",
    shortDescription: "Raised an inquiry previously, but haven't received a resolution within the promised timeline.",
    checklist: [
      { id: "c1", label: "Located existing ticket ID or original email thread subject" },
      { id: "c2", label: "Checked spam/promotions folder for replies from support@bebodywise.com" },
      { id: "c3", label: "Confirmed at least 24-48 business hours have passed since last interaction" },
    ],
    fields: [
      { id: "customer_name", label: "Your Full Name", placeholder: "e.g. Priya Sharma" },
      { id: "customer_phone", label: "Your Phone Number", placeholder: "e.g. +91 98765 43210" },
      { id: "ticket_number", label: "Previous Ticket ID / Subject", placeholder: "e.g. TIK-84019 or Re: Order Delay" },
      { id: "initial_contact_date", label: "Initial Contact Date", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "last_followup_date", label: "Last Follow-Up Date", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "contact_channel", label: "Channel Used (Email / WhatsApp / Portal)", placeholder: "e.g. Email" },
      { id: "summary_of_issue", label: "Brief Summary of Unresolved Matter", placeholder: "e.g. Awaiting refund confirmation for returned parcel" },
    ],
    caution: "We cannot prioritize or change the queue status of merchant support tickets. This prepares an organized follow-up thread documenting previous contact dates.",
    generateTemplate: (v, checked) => `Subject: Escalation Request: Follow-up on Ticket ${v.ticket_number || "[Ticket ID]"}

Dear Customer Care Supervisor,

I am following up on an unresolved matter regarding my previous support request.

Interaction Timeline:
- Ticket / Reference ID: ${v.ticket_number || "[Ticket ID]"}
- Initial Contact Date: ${v.initial_contact_date || "[Date]"}
- Last Follow-up Sent: ${v.last_followup_date || "[Date]"}
- Channel Used: ${v.contact_channel || "[Email / Chat]"}

Summary of Unresolved Issue:
${v.summary_of_issue || "[Describe the pending resolution, e.g., missing refund / pending replacement]"}

Verification Steps Completed:
${formatChecklist(checked)}

As the standard response window has elapsed, please escalate this request to a senior representative.

Thank you,
${v.customer_name || "[Your Name]"}
${v.customer_phone || "[Your Phone Number]"}`,
  },

  // 7. Product reaction or tolerability
  {
    id: "product-reaction",
    slug: "product-reaction",
    title: "Product reaction or tolerability",
    shortDescription: "Experienced unexpected redness, itching, burning sensation, or skin/scalp sensitivity.",
    checklist: [
      { id: "c1", label: "Immediately discontinued use of the product" },
      { id: "c2", label: "Gently washed affected area with cool water" },
      { id: "c3", label: "Captured clear photograph of packaging ingredients list and batch code" },
      { id: "c4", label: "Noted date, time, and application area" },
    ],
    fields: [
      { id: "customer_name", label: "Your Full Name", placeholder: "e.g. Priya Sharma" },
      { id: "customer_phone", label: "Your Phone Number", placeholder: "e.g. +91 98765 43210" },
      { id: "product_name", label: "Product Name", placeholder: "e.g. 1% Salicylic Acid Body Wash" },
      { id: "batch_number", label: "Batch Code (printed on bottle)", placeholder: "e.g. B26-104A" },
      { id: "first_use_date", label: "Date of First Application", placeholder: "YYYY-MM-DD", type: "date" },
      { id: "symptoms_observed", label: "Observed Sensation / Reaction", placeholder: "e.g. Red bumps and burning on inner arm within 30 minutes" },
      { id: "prior_patch_test", label: "Was a forearm patch test done?", placeholder: "e.g. Yes / No" },
    ],
    caution: "Health & Safety Warning: Stop using the product and consult a qualified health professional if you have a significant reaction. We provide zero clinical evaluations and do not assess medical severity.",
    generateTemplate: (v, checked) => `Subject: Product Tolerability / Adverse Reaction Notice - ${v.product_name || "[Product Name]"}

Dear Be Bodywise Safety & Quality Team,

I am writing to report an adverse skin reaction experienced after using one of your products.

Incident Details:
- Product Name: ${v.product_name || "[Product Name]"}
- Batch Number: ${v.batch_number || "[Batch Number on bottle]"}
- First Application Date: ${v.first_use_date || "[Date]"}
- Patch Test Conducted: ${v.prior_patch_test || "[Yes / No]"}
- Reaction Experienced: ${v.symptoms_observed || "[Describe symptoms and timeline]"}

Verification Steps Completed:
${formatChecklist(checked)}

I have stopped using the product completely. Please log this batch for quality review and advise on refund or product return procedure.

Thank you,
${v.customer_name || "[Your Name]"}
${v.customer_phone || "[Your Phone Number]"}`,
  },
];
