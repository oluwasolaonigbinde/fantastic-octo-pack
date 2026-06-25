// Admin parity fallback policy:
// - keep existing live API-backed values live
// - when an in-scope admin screen/state has no backend support yet, use
//   Figma-backed fallback content from this file instead of invented neutral copy
// - keep these fallbacks shaped like stable view adapters so swapping to real data
//   later is mechanical rather than a redesign

export const ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK = {
  requesterPhone: "08130000000",
  requesterEmail: "oluwatunde@gmail.com",
  productName: "The name of the product",
  requestType: "Installation",
} as const;

export const ADMIN_DASHBOARD_FIGMA_FALLBACK = {
  revenueBreakdownDesktop: "Equipment: 305 | Consumables: 105",
  revenueBreakdownMobile: ["Equipment: 305", "Consumables: 105"],
  mobileRfqRatio: {
    quotesPercent: 30,
    rfqsPercent: 70,
    quotesLabel: "30% - Expiry rate",
    rfqsLabel: "70% - Renewal rate",
  },
} as const;

export const ADMIN_PRODUCTS_FIGMA_FALLBACK = {
  dateRangeLabel: "May 6 - June 4, 2025",
  totals: {
    totalListed: 1250,
    approved: 1250,
    pending: 1250,
    declined: 1250,
  },
} as const;

export const ADMIN_RFQS_ORDERS_FIGMA_FALLBACK = {
  dateRangeLabel: "May 6 - June 4, 2025",
  rfqTotals: {
    totalRequested: 1208,
    quoteSent: 1008,
    quoteReceived: 1008,
    quoteApproved: 1008,
    quoteDeclined: 1008,
  },
} as const;

export const ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK = {
  orderId: "Not available",
  buyerId: "Not available",
  sellerId: "Not available",
  itemName: "The name of the product",
  engineerId: "Not available",
  amount: "NGN 50,000",
  ageOfDays: "2 days",
} as const;

export const ADMIN_PAYMENT_ROWS = Array.from({ length: 9 }).map((_, i) => ({
  id: `pay-${i + 1}`,
  orderId: "The order ID",
  buyerId: "Buyer ID/name",
  sellerId: "Samuel S.",
  nameOfItem: "MRI machine",
  engineerId: "Samuel S.",
  status: ([
    "Under dispute",
    "Delivered",
    "Payment",
    "Delivered",
    "Delivered",
    "Under dispute",
    "Under dispute",
    "Under dispute",
    "Under dispute",
  ] as const)[i],
  dateTime: "25/11/25 - 08:00 AM",
}));

export const ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK = {
  invoiceId: "Not available",
  itemName: "The name of the product",
  unitPrice: "NGN 50,000",
  quantity: "10",
  totalAmount: "NGN 500,000",
  buyerName: "Samuel Smart",
  distributorName: "Emmanuella Ifeanyi",
  paymentMethod: "ESCROW",
  distributorAccount: "43546536577",
  bankName: "Opay",
  dateCreated: "25/11/25",
} as const;

export const ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK = {
  invoiceId: "Not available",
  itemName: "The name of the product",
  unitPrice: "NGN 50,000",
  quantity: "10",
  totalAmount: "NGN 500,000",
  buyerName: "Samuel Smart",
  distributorName: "Emmanuella Ifeanyi",
  paymentMethod: "ESCROW",
  distributorAccount: "43546536577",
  bankName: "Opay",
  dateCreated: "25/11/25",
} as const;

export const ADMIN_SUBSCRIPTION_SUBSCRIBER_FIGMA_FALLBACK = {
  subscriberFields: [
    ["Name of subscriber", "Samuel Smart"],
    ["Email address", "example245@gmail.com"],
    ["Start Date", "28/11/2025"],
    ["End date", "28/11/2025"],
    ["Usage limit", "2 - months"],
    ["Renewal status", "Auto - renewal"],
  ],
  access: [
    ["Visibility level", "Upload up to 25 products"],
    ["RFQ Access", "Respond to RFQs"],
    ["Messaging Access", "Full buyer message"],
  ],
  plans: [
    {
      title: "Free Plan",
      price: "This is a free plan",
      sub: "No fee is required",
      active: false,
    },
    {
      title: "Basic Plan",
      price: "NGN 50,000 / month",
      sub: "NGN 150,000 billed yearly",
      active: true,
    },
    {
      title: "Premium Plan",
      price: "NGN 75,000 / month",
      sub: "NGN 225,000 billed yearly",
      active: false,
    },
  ],
  planFee: "NGN 25,000",
  planFeatures: [
    "Upload up to 25 products",
    "Full buyer message",
    "Respond to RFQs",
    "Bulk product upload",
    "Basic Analytics",
  ],
} as const;

export const ADMIN_SUBSCRIPTION_ROWS = Array.from({ length: 6 }).map((_, i) => ({
  id: `sub-${i + 1}`,
  name: "Samuel Smart",
  email: "example245@gmail.com",
  currentPlan: "Free",
  startDate: "28/01/2025",
  endDate: "08/07/2025",
  usageLimit: "3 Months",
  renewalStatus: "Auto-renew",
  status: "Active" as const,
  expRenewalDate: "20/03/2025",
  arpu: "NGN 0",
}));

export const ADMIN_PLATFORM_USER_KYC_OVERVIEW_FIGMA_FALLBACK = {
  fullName: "The name of the user",
  email: "example245@gmail.com",
  role: "Buyer",
  tierLabel: "Basic Buyer",
  status: "Pending",
  registrationDate: "28/03/2026",
  documentSubmitted: "3/3",
  textFields: [
    ["Country of origin", "Nigeria"],
    ["Address", "12 Marina Road, Lagos"],
  ],
  documents: [
    "Business registration document.pdf",
    "Proof of address.pdf",
    "Government-issued ID.pdf",
  ],
} as const;

export const ADMIN_PLATFORM_USERS_ADD_AGENT_FIGMA_FALLBACK = {
  title: "Add a New Agent",
  description:
    "Kindly enter all correct information to successfully create a new agent.",
  cta: "Proceed To Create This Agent",
  rolePlaceholder: "Agent",
} as const;
