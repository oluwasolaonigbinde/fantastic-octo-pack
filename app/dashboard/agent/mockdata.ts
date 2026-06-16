// Agent Portal mock/static data — replace with real API calls when backend is ready

export type KycStatus = "Approved" | "Pending" | "Rejected";
export type OrderStatus = "Awaiting payment" | "In ESCROW" | "Completed" | "Cancelled";
export type EscrowStatus = "In delivery" | "Released" | "Disputed";
export type BusinessType = "Distributor" | "Buyer" | "OEM" | "Service Engineer";

export interface BusinessOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KycStatus;
  totalOrders: number;
  earnings: string;
  businessType: BusinessType;
  address: string;
  onboardedDate: string;
  escrowBalance: string;
  productsListed: number;
}

export interface AgentOrder {
  id: string;
  itemName: string;
  sellerName: string;
  buyerName: string;
  serviceType: string;
  amount: string;
  status: OrderStatus;
  commissionAmount: string;
  paymentMethod: string;
  dateCreated: string;
  escrowStatus: string;
  deliveryAddress: string;
}

export interface EscrowOrder {
  id: string;
  itemName: string;
  sellerName: string;
  buyerName: string;
  escrowTimeline: string;
  expectedRelease: string;
  commission: string;
  status: EscrowStatus;
}

export interface WalletTransaction {
  id: string;
  description: string;
  date: string;
  amount: string;
  type: "credit" | "debit";
  status: "Completed" | "Pending" | "Failed";
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  type: "article" | "video";
  accentColor: string;
}

export interface DownloadableResource {
  id: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
}

export interface AgentNotification {
  id: string;
  title: string;
  body: string;
  dateTime: string;
  read: boolean;
  group: string;
}

// ── Business Owners ──────────────────────────────────────────────────────────

const makeOwner = (
  id: string,
  name: string,
  type: BusinessType,
  kycStatus: KycStatus = "Approved",
): BusinessOwner => ({
  id,
  name,
  email: "example001@gmail.com",
  phone: "08186763183",
  kycStatus,
  totalOrders: 40,
  earnings: "₦150,000",
  businessType: type,
  address: "12 Marin a Rd, Lagos",
  onboardedDate: "12/01/2026",
  escrowBalance: "₦150,000",
  productsListed: 30,
});

export const agentDistributors: BusinessOwner[] = [
  makeOwner("d1", "The name of the distributor", "Distributor"),
  makeOwner("d2", "The name of the distributor", "Distributor", "Pending"),
  makeOwner("d3", "The name of the distributor", "Distributor"),
  makeOwner("d4", "The name of the distributor", "Distributor"),
  makeOwner("d5", "The name of the distributor", "Distributor"),
  makeOwner("d6", "The name of the distributor", "Distributor"),
  makeOwner("d7", "The name of the distributor", "Distributor"),
  makeOwner("d8", "The name of the distributor", "Distributor"),
];

export const agentBuyers: BusinessOwner[] = [
  makeOwner("b1", "The name of the buyer", "Buyer"),
  makeOwner("b2", "The name of the buyer", "Buyer"),
  makeOwner("b3", "The name of the buyer", "Buyer"),
  makeOwner("b4", "The name of the buyer", "Buyer"),
  makeOwner("b5", "The name of the buyer", "Buyer"),
  makeOwner("b6", "The name of the buyer", "Buyer"),
  makeOwner("b7", "The name of the buyer", "Buyer"),
  makeOwner("b8", "The name of the buyer", "Buyer"),
];

export const agentOEMs: BusinessOwner[] = [
  makeOwner("o1", "The name of the OEM", "OEM"),
  makeOwner("o2", "The name of the OEM", "OEM"),
  makeOwner("o3", "The name of the OEM", "OEM"),
  makeOwner("o4", "The name of the OEM", "OEM"),
  makeOwner("o5", "The name of the OEM", "OEM"),
  makeOwner("o6", "The name of the OEM", "OEM"),
  makeOwner("o7", "The name of the OEM", "OEM"),
  makeOwner("o8", "The name of the OEM", "OEM"),
];

export const agentServiceEngineers: BusinessOwner[] = [
  makeOwner("e1", "The name of the engineer", "Service Engineer"),
  makeOwner("e2", "The name of the engineer", "Service Engineer"),
  makeOwner("e3", "The name of the engineer", "Service Engineer"),
  makeOwner("e4", "The name of the engineer", "Service Engineer"),
];

export const allBusinessOwners: BusinessOwner[] = [
  ...agentDistributors,
  ...agentBuyers,
  ...agentOEMs,
  ...agentServiceEngineers,
];

// ── Orders ───────────────────────────────────────────────────────────────────

const makeOrder = (
  id: string,
  status: OrderStatus = "Awaiting payment",
): AgentOrder => ({
  id,
  itemName: "MRI Machine",
  sellerName: "Samuel Smart",
  buyerName: "Samuel Smart",
  serviceType: "Installation",
  amount: "₦150,000",
  status,
  commissionAmount: "₦15,000",
  paymentMethod: "ESCROW",
  dateCreated: "25/09/2025",
  escrowStatus: "In ESCROW",
  deliveryAddress:
    "Lorem ipsum dolor sit amet consectetur. Cras arcu sit massa consequat mi quis purus.",
});

export const agentOrders: AgentOrder[] = [
  makeOrder("ORDER-0010"),
  makeOrder("ORDER-0010", "In ESCROW"),
  makeOrder("ORDER-0010"),
  makeOrder("ORDER-0010"),
  makeOrder("ORDER-0010"),
  makeOrder("ORDER-0010"),
  makeOrder("ORDER-0010"),
];

// ── ESCROW ───────────────────────────────────────────────────────────────────

const makeEscrow = (id: string): EscrowOrder => ({
  id,
  itemName: "MRI Machine",
  sellerName: "Samuel Smart",
  buyerName: "Samuel Smart",
  escrowTimeline: "3 days",
  expectedRelease: "14-01-2026",
  commission: "₦150,000",
  status: "In delivery",
});

export const agentEscrowOrders: EscrowOrder[] = Array.from({ length: 7 }, (_, i) =>
  makeEscrow(`ORDER-001${i}`),
);

// ── Wallet ───────────────────────────────────────────────────────────────────

export const agentWalletTransactions: WalletTransaction[] = [
  {
    id: "tx1",
    description: "Commission from ORD - 221",
    date: "14th January, 2026 - 09:30am",
    amount: "+₦150,000",
    type: "credit",
    status: "Completed",
  },
  {
    id: "tx2",
    description: "Withdrawal to GT Bank",
    date: "14th January, 2026 - 09:30am",
    amount: "-₦150,000",
    type: "debit",
    status: "Completed",
  },
  {
    id: "tx3",
    description: "Withdrawal to GT Bank",
    date: "14th January, 2026 - 09:30am",
    amount: "-₦150,000",
    type: "debit",
    status: "Completed",
  },
];

// ── Training ─────────────────────────────────────────────────────────────────

export const agentCourses: TrainingCourse[] = [
  {
    id: "c1",
    title: "How to pitch to Distributors, OEMS & Buyers.",
    description: "Master the art of onboarding businesses to BAIY",
    type: "article",
    accentColor: "#FEE2E2",
  },
  {
    id: "c2",
    title: "How to pitch to Distributors, OEMS & Buyers.",
    description: "Master the art of onboarding businesses to BAIY",
    type: "article",
    accentColor: "#FEF3C7",
  },
  {
    id: "c3",
    title: "Escrow Services",
    description:
      "Learn how BAIY's secure escrow system protects both buyers and sellers in every transaction.",
    type: "article",
    accentColor: "#D1FAE5",
  },
  {
    id: "c4",
    title: "How to pitch to Distributors, OEMS & Buyers.",
    description: "Master the art of onboarding businesses to BAIY",
    type: "video",
    accentColor: "#E0E7FF",
  },
];

export const agentResources: DownloadableResource[] = [
  {
    id: "r1",
    title: "OEM Product Sheet Template",
    description: "Ready-to-use script for pitching to distributors",
    fileType: "PDF",
    fileSize: "245 KB",
  },
  {
    id: "r2",
    title: "OEM Product Sheet Template",
    description: "Ready-to-use script for pitching to distributors",
    fileType: "PDF",
    fileSize: "245 KB",
  },
  {
    id: "r3",
    title: "OEM Product Sheet Template",
    description: "Ready-to-use script for pitching to distributors",
    fileType: "PDF",
    fileSize: "245 KB",
  },
];

// ── Notifications ─────────────────────────────────────────────────────────────

export const agentNotifications: AgentNotification[] = [
  {
    id: "n1",
    title: "Notification",
    body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendreritNeque congue pellentesque magngwu dhwv...",
    dateTime: "17/07/2024 3:55pm",
    read: true,
    group: "Today",
  },
  {
    id: "n2",
    title: "Notification",
    body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendreritNeque congue pellentesque magngwu dhwv...",
    dateTime: "17/07/2024 3:55pm",
    read: true,
    group: "Today",
  },
  {
    id: "n3",
    title: "Notification",
    body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendreritNeque congue pellentesque magngwu dhwv...",
    dateTime: "17/07/2024 3:55pm",
    read: false,
    group: "Yesterday",
  },
  {
    id: "n4",
    title: "Notification",
    body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendreritNeque congue pellentesque magngwu dhwv...",
    dateTime: "17/07/2024 3:55pm",
    read: false,
    group: "Yesterday",
  },
  {
    id: "n5",
    title: "Notification",
    body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendreritNeque congue pellentesque magngwu dhwv...",
    dateTime: "17/07/2024 3:55pm",
    read: false,
    group: "18th November, 2025",
  },
  {
    id: "n6",
    title: "Notification",
    body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendreritNeque congue pellentesque magngwu dhwv...",
    dateTime: "17/07/2024 3:55pm",
    read: false,
    group: "18th November, 2025",
  },
];

// ── Dashboard summary ─────────────────────────────────────────────────────────

export const agentKpis = {
  allSavings: "₦150,000",
  availableFunds: "₦150,000",
  pendingCommissions: "₦150,000",
  businessesOnboarded: 5,
};

export const agentPendingTasks = [
  { id: "t1", text: "Complete KYC update for 3 businesses", label: "1 task" },
  { id: "t2", text: "Complete KYC update for 3 businesses", label: "1 task" },
  { id: "t3", text: "Complete KYC update for 3 businesses", label: "1 task" },
  { id: "t4", text: "Complete KYC update for 3 businesses", label: "1 task" },
];

export const agentRecentActivities = [
  { id: "a1", text: "KYC upgrade approved", sub: "Action", time: "1 hr ago" },
  { id: "a2", text: "Order completed", sub: "Today", time: "3 hrs ago" },
  { id: "a3", text: "Order completed", sub: "Today", time: "5 hrs ago" },
  { id: "a4", text: "Order completed", sub: "Today", time: "6 hrs ago" },
];

export const agentTopBusinesses = [
  { id: "tb1", name: "The name of business", email: "example@gmail.com" },
  { id: "tb2", name: "The name of business", email: "example@gmail.com" },
  { id: "tb3", name: "The name of business", email: "example@gmail.com" },
  { id: "tb4", name: "The name of business", email: "example@gmail.com" },
];

export const agentEarningsTrend = [
  { month: "Jan", value: 180000 },
  { month: "Feb", value: 205000 },
  { month: "Mar", value: 170000 },
  { month: "Apr", value: 280000 },
  { month: "May", value: 140000 },
  { month: "Jun", value: 215000 },
  { month: "Jul", value: 190000 },
  { month: "Aug", value: 115000 },
  { month: "Sep", value: 170000 },
  { month: "Oct", value: 130000 },
  { month: "Nov", value: 145000 },
  { month: "Dec", value: 150000 },
];
