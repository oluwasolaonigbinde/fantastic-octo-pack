"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  MessageSquare,
  Package,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react";

import Header from "../../component/header";
import { Button, Input, RightSlider, SingleSelect } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import adminService, {
  type AdminPagination,
  type AdminPlatformUserRow,
  type AdminPlatformUsersSummary,
} from "@/services/adminService";
import { UserRole } from "@/types/user";

const POLL_INTERVAL_MS = 60_000;
const PAGE_SIZE = 20;

type TopTab = "approved" | "onboarding";
type RoleTab = "buyers" | "distributors" | "oems" | "agents" | "engineers";

type OnboardingRow = {
  id: string;
  name: string;
  userType: string;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
  country: string;
  category: string;
};

const ROLE_TABS: { key: RoleTab; label: string; role: UserRole }[] = [
  { key: "buyers", label: "Buyers", role: UserRole.BUYER },
  { key: "distributors", label: "Distributors", role: UserRole.DISTRIBUTOR },
  { key: "oems", label: "OEMs", role: UserRole.OEM },
  { key: "agents", label: "Agents", role: UserRole.AGENT },
  { key: "engineers", label: "Service engineers", role: UserRole.ENGINEER },
];

const ONBOARDING_ROWS: OnboardingRow[] = Array.from({ length: 12 }).map((_, index) => ({
  id: `onboarding-${index + 1}`,
  name: "The name of the user",
  userType: "Service Engineers",
  status: "Pending",
  requestDate: "17/09/2025 - 04:09pm",
  country: "Nigeria",
  category: "Equipment maintenance",
}));

const EMPTY_SUMMARY: AdminPlatformUsersSummary = {
  approvedUsers: {
    total: 0,
    buyers: 0,
    distributors: 0,
    oems: 0,
    engineers: 0,
    agents: 0,
  },
  onboardingRequests: {
    supported: false,
    total: 0,
    distributors: 0,
    oems: 0,
    engineers: 0,
  },
};

const EMPTY_PAGE: AdminPagination<AdminPlatformUserRow> = {
  docs: [],
  totalDocs: 0,
  limit: PAGE_SIZE,
  totalPages: 1,
  page: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
};

function formatDateTime(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return `${date.toLocaleDateString("en-GB")} - ${date
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()}`;
}

function statusLabel(value?: string | null): string {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SummaryDivider() {
  return <span className="h-2 border-l border-gray5" aria-hidden="true" />;
}

function UserAvatar({ row }: { row: AdminPlatformUserRow }) {
  return (
    <div className="flex items-center gap-3">
      <span className="size-8 shrink-0 overflow-hidden rounded-lg bg-[#D9D9D9]">
        {row.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.avatarUrl} alt="" className="size-full object-cover" />
        ) : null}
      </span>
      <span className="font-normal text-gray1">{row.name}</span>
    </div>
  );
}

function StatusText({ status }: { status?: string | null }) {
  const label = statusLabel(status);
  const isPending = label.toLowerCase().includes("pending");

  return (
    <span className={isPending ? "text-warning" : "text-success"}>
      {label}
    </span>
  );
}

function ActionIcons({ onView }: { onView: () => void }) {
  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        aria-label="View details"
        onClick={onView}
        className="text-success hover:text-success/80"
      >
        <Eye size={18} />
      </button>
      <button
        type="button"
        disabled
        title="Messaging is deferred"
        className="cursor-not-allowed text-primary opacity-70"
      >
        <MessageSquare size={18} />
      </button>
    </span>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center text-gray3">
        No users match the current filters.
      </TableCell>
    </TableRow>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1 border-b border-gray6 pb-5 last:border-0">
      <p className="text-sm leading-5 text-gray2">{label}</p>
      <p className="break-words text-base leading-6 text-gray1">
        {value === undefined || value === null || value === "" ? "Not available" : value}
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="flex h-[86px] w-full items-center justify-between rounded-[12px] px-2 text-left hover:bg-gray7"
    >
      <span className="flex min-w-0 items-center gap-4">
        <span className="flex size-[62px] shrink-0 items-center justify-center rounded-[12px] bg-primary-light text-primary">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-medium leading-8 text-gray1">
            {title}
          </span>
          <span className="block text-sm leading-7 text-gray2">{description}</span>
        </span>
      </span>
      <ChevronRight size={22} className="shrink-0 text-gray2" />
    </button>
  );
}

function PlatformUserDrawer({
  user,
  onClose,
}: {
  user: AdminPlatformUserRow | null;
  onClose: () => void;
}) {
  const actionCards = [
    {
      icon: <FileText size={30} />,
      title: user?.role === UserRole.BUYER ? "RFQs" : "Orders",
      description:
        user?.role === UserRole.BUYER
          ? "View submitted request for quote"
          : "View full profile and details",
    },
    { icon: <ShieldCheck size={30} />, title: "KYC", description: "View KYC status and verification" },
    { icon: <Store size={30} />, title: "Store", description: "Manage store" },
    { icon: <Package size={30} />, title: "Products", description: "View and manage product" },
  ];

  return (
    <RightSlider
      title={`${user?.roleLabel ?? "User"} Details`}
      open={Boolean(user)}
      onClose={onClose}
      bodyClassName="px-10 pb-10"
    >
      {user ? (
        <div className="space-y-8 pt-6">
          <section className="text-center">
            <div className="mx-auto size-[96px] overflow-hidden rounded-full bg-gray5">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : null}
            </div>
            <h3 className="mt-4 text-2xl font-medium leading-10 text-gray1">
              {user.name}
            </h3>
            <div className="mt-2 inline-flex rounded-[8px] bg-primary-light px-3 py-1 text-sm leading-5 text-primary">
              {user.roleLabel}
            </div>
          </section>

          <section className="space-y-5">
            <DetailItem label="User ID" value={user.id} />
            <DetailItem label="Phone Number" value={user.phoneNumber} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Date Joined" value={formatDateTime(user.dateRegistered)} />
            <DetailItem label="Country" value={user.country} />
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 pt-1 text-base leading-8 text-danger opacity-70"
            >
              <Ban size={22} />
              Suspend Account
            </button>
          </section>

          <section className="space-y-4 border-t border-gray6 pt-8">
            <div>
              <h4 className="text-lg font-medium leading-8 text-gray1">Actions</h4>
              <p className="text-sm leading-5 text-gray2">
                Manage key actions for this {user.roleLabel.toLowerCase()}.
              </p>
            </div>
            <div className="space-y-3">
              {actionCards.map((card) => (
                <ActionCard key={card.title} {...card} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </RightSlider>
  );
}

function OnboardingDrawer({
  request,
  onClose,
}: {
  request: OnboardingRow | null;
  onClose: () => void;
}) {
  return (
    <RightSlider
      title="Onboarding Request Details"
      open={Boolean(request)}
      onClose={onClose}
    >
      {request ? (
        <div className="space-y-6 pt-6">
          <div className="rounded-[16px] border border-[#FFE079] bg-[#FFF6D9] px-8 py-5">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium leading-6 text-[#272B36]">
                Request Status
              </p>
              <span className="rounded-[8px] bg-warning px-4 py-2 text-base leading-7 text-white">
                {request.status}
              </span>
            </div>
          </div>
          <DetailItem label="User name" value={request.name} />
          <DetailItem label="User type" value={request.userType} />
          <DetailItem label="Request date" value={request.requestDate} />
          <DetailItem label="Country" value={request.country} />
          <DetailItem label="Product category" value={request.category} />
          <Button title="Review Onboarding Request" className="h-[60px] rounded-[14px]" />
        </div>
      ) : null}
    </RightSlider>
  );
}

export default function AdminPlatformUsersPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const [topTab, setTopTab] = useState<TopTab>("approved");
  const [roleTab, setRoleTab] = useState<RoleTab>("buyers");
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [usersPage, setUsersPage] = useState(EMPTY_PAGE);
  const [selectedUser, setSelectedUser] = useState<AdminPlatformUserRow | null>(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draftFilters, setDraftFilters] = useState({
    search: "",
    date: "",
    country: "all",
    category: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);
  const [page, setPage] = useState(1);

  const activeRole = useMemo(
    () => ROLE_TABS.find((item) => item.key === roleTab)?.role ?? UserRole.BUYER,
    [roleTab]
  );

  const loadData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const [nextSummary, nextUsers] = await Promise.all([
        adminService.getPlatformUsersSummary(token),
        topTab === "approved"
          ? adminService.getPlatformUsers(token, {
              role: activeRole,
              search: appliedFilters.search.trim() || undefined,
              createdFrom: appliedFilters.date || undefined,
              createdTo: appliedFilters.date || undefined,
              country: appliedFilters.country !== "all" ? appliedFilters.country : undefined,
              category:
                appliedFilters.category !== "all" ? appliedFilters.category : undefined,
              page,
              limit: PAGE_SIZE,
            })
          : Promise.resolve(EMPTY_PAGE),
      ]);

      setSummary(nextSummary);
      setUsersPage(nextUsers);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load platform users."
      );
    } finally {
      setLoading(false);
    }
  }, [activeRole, appliedFilters, page, token, topTab]);

  useEffect(() => {
    if (!token) return;

    const initialLoadId = window.setTimeout(() => void loadData(), 0);
    const intervalId = window.setInterval(() => void loadData(), POLL_INTERVAL_MS);
    const onFocus = () => void loadData();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadData, token]);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const approvedSummary = summary.approvedUsers;
  const onboardingSummary = summary.onboardingRequests;
  const onboardingTotal = onboardingSummary.supported
    ? onboardingSummary.total
    : ONBOARDING_ROWS.length;
  const activeRoleLabel = ROLE_TABS.find((item) => item.key === roleTab)?.label ?? "Buyers";

  return (
    <div>
      <Header
        title="Platform Users"
        description="View all users and process onboarding request from users"
      />

      <div className="min-h-screen bg-gray7 p-4">
        <div className="mx-auto max-w-[1160px] space-y-4">
          {error ? (
            <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid h-14 grid-cols-2 overflow-hidden rounded-[8px] border border-gray6 bg-white">
            {(
              [
                ["approved", "Approved Users"],
                ["onboarding", "Onboarding Request"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTopTab(key);
                  setPage(1);
                }}
                className={`text-center text-base leading-6 transition ${
                  topTab === key
                    ? "bg-primary text-white"
                    : "bg-gray6 text-gray1 hover:bg-primary-light"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <section className="min-h-[158px] rounded-[16px] border border-gray5 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-[32px] font-medium leading-[48px] text-gray1">
                  {topTab === "approved" ? approvedSummary.total : onboardingTotal}
                </h2>
                <p className="text-lg leading-7 text-gray1">
                  {topTab === "approved"
                    ? "Total platform users"
                    : "Total onboarding request"}
                </p>
                {topTab === "approved" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-base leading-6 text-gray3">
                    <span>Buyers: {approvedSummary.buyers}</span>
                    <SummaryDivider />
                    <span>Distributors: {approvedSummary.distributors}</span>
                    <SummaryDivider />
                    <span>Service Engineers: {approvedSummary.engineers}</span>
                    <SummaryDivider />
                    <span>OEMs: {approvedSummary.oems}</span>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-base leading-6 text-gray3">
                    <span>
                      Distributors:{" "}
                      {onboardingSummary.supported
                        ? onboardingSummary.distributors
                        : 109}
                    </span>
                    <SummaryDivider />
                    <span>
                      OEMs: {onboardingSummary.supported ? onboardingSummary.oems : 95}
                    </span>
                    <SummaryDivider />
                    <span>
                      Service Engineers:{" "}
                      {onboardingSummary.supported
                        ? onboardingSummary.engineers
                        : 105}
                    </span>
                  </div>
                )}
              </div>
              {topTab === "onboarding" ? (
                <Button
                  title="Add new agent"
                  iconLeft={<Plus size={18} />}
                  className="h-[60px] w-full rounded-[12px] md:w-[250px]"
                  type="button"
                />
              ) : null}
            </div>
          </section>

          {topTab === "approved" ? (
            <div className="overflow-x-auto rounded-[2px] bg-white">
              <div className="grid min-w-[900px] grid-cols-5 border-b border-gray6">
                {ROLE_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setRoleTab(key);
                      setPage(1);
                    }}
                    className={`h-14 text-base leading-6 ${
                      roleTab === key ? "bg-primary text-white" : "bg-white text-gray1"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {topTab === "approved" ? (
            <section className="min-h-[840px] rounded-[16px] border border-gray5 bg-white p-5">
              <h3 className="text-xl font-medium leading-8 text-gray1">
                All {activeRoleLabel}
              </h3>
              <p className="mt-5 text-sm font-medium leading-6 text-gray1">
                Filter table list by:
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-5">
                <Input
                  label="Users' name"
                  placeholder="Enter user name"
                  value={draftFilters.search}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      search: event.target.value,
                    }))
                  }
                  maxWidth="w-full md:w-[250px]"
                  className="rounded-[12px]"
                />
                <Input
                  label={roleTab === "distributors" ? "Date verified" : "Date registered"}
                  type="date"
                  value={draftFilters.date}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      date: event.target.value,
                    }))
                  }
                  maxWidth="w-full md:w-[250px]"
                  className="rounded-[12px]"
                />
                {roleTab === "distributors" ? (
                  <SingleSelect
                    label="Country of delivery"
                    value={draftFilters.country}
                    onValueChange={(country) =>
                      setDraftFilters((prev) => ({ ...prev, country }))
                    }
                    options={[
                      { value: "all", label: "Select option" },
                      { value: "Nigeria", label: "Nigeria" },
                    ]}
                    maxWidth="w-full md:w-[250px]"
                    className="rounded-[12px]"
                  />
                ) : roleTab === "oems" ? (
                  <SingleSelect
                    label="Product category"
                    value={draftFilters.category}
                    onValueChange={(category) =>
                      setDraftFilters((prev) => ({ ...prev, category }))
                    }
                    options={[
                      { value: "all", label: "Select category" },
                      { value: "Equipment", label: "Equipment" },
                      { value: "Consumables", label: "Consumables" },
                    ]}
                    maxWidth="w-full md:w-[250px]"
                    className="rounded-[12px]"
                  />
                ) : null}
                <Button
                  title="Filter"
                  iconLeft={<Filter size={18} />}
                  className="h-[60px] w-full rounded-[12px] md:w-[250px]"
                  type="button"
                  onClick={applyFilters}
                  isBusy={loading}
                />
              </div>

              <div className="mt-7 overflow-hidden border-r border-gray6">
                <Table className="min-w-[1060px]">
                  {roleTab === "buyers" ? (
                    <>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Buyers&apos; name</TableHead>
                          <TableHead>Date registered</TableHead>
                          <TableHead>Phone number</TableHead>
                          <TableHead>Email address</TableHead>
                          <TableHead>RFQs sent</TableHead>
                          <TableHead>Quote received</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersPage.docs.length === 0 ? (
                          <EmptyRow colSpan={7} />
                        ) : (
                          usersPage.docs.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="min-w-[220px]">
                                <UserAvatar row={row} />
                              </TableCell>
                              <TableCell>{formatDateTime(row.dateRegistered)}</TableCell>
                              <TableCell>{row.phoneNumber ?? "Not available"}</TableCell>
                              <TableCell>{row.email ?? "Not available"}</TableCell>
                              <TableCell>{row.metrics.rfqsSent ?? 0}</TableCell>
                              <TableCell>{row.metrics.quoteReceived ?? 0}</TableCell>
                              <TableCell>
                                <ActionIcons onView={() => setSelectedUser(row)} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </>
                  ) : null}

                  {roleTab === "distributors" ? (
                    <>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Distributors name</TableHead>
                          <TableHead>Date verified</TableHead>
                          <TableHead>Listed products</TableHead>
                          <TableHead>Total quote sent</TableHead>
                          <TableHead>Listing request</TableHead>
                          <TableHead>Country of delivery</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersPage.docs.length === 0 ? (
                          <EmptyRow colSpan={7} />
                        ) : (
                          usersPage.docs.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="min-w-[220px]">
                                <UserAvatar row={row} />
                              </TableCell>
                              <TableCell>{formatDateTime(row.dateVerified)}</TableCell>
                              <TableCell>{row.metrics.listedProducts ?? 0}</TableCell>
                              <TableCell>{row.metrics.totalQuoteSent ?? 0}</TableCell>
                              <TableCell>{row.metrics.listingRequest ?? 0}</TableCell>
                              <TableCell>{row.country ?? "Not available"}</TableCell>
                              <TableCell>
                                <ActionIcons onView={() => setSelectedUser(row)} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </>
                  ) : null}

                  {roleTab === "oems" || roleTab === "agents" ? (
                    <>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{roleTab === "oems" ? "OEM name" : "Agent name"}</TableHead>
                          <TableHead>
                            {roleTab === "oems" ? "Date verified" : "Date onboarded"}
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approved listing</TableHead>
                          <TableHead>Product category</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersPage.docs.length === 0 ? (
                          <EmptyRow colSpan={6} />
                        ) : (
                          usersPage.docs.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="min-w-[220px]">
                                <UserAvatar row={row} />
                              </TableCell>
                              <TableCell>
                                {roleTab === "oems"
                                  ? formatDateTime(row.dateVerified)
                                  : formatDateTime(row.dateRegistered)}
                              </TableCell>
                              <TableCell>
                                <StatusText status={row.status} />
                              </TableCell>
                              <TableCell>{row.metrics.approvedListing ?? 0}</TableCell>
                              <TableCell>
                                {row.metrics.productCategory ?? "Not available"}
                              </TableCell>
                              <TableCell>
                                <ActionIcons onView={() => setSelectedUser(row)} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </>
                  ) : null}

                  {roleTab === "engineers" ? (
                    <>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service engineer name</TableHead>
                          <TableHead>Date registered</TableHead>
                          <TableHead>Phone number</TableHead>
                          <TableHead>Email address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersPage.docs.length === 0 ? (
                          <EmptyRow colSpan={6} />
                        ) : (
                          usersPage.docs.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="min-w-[220px]">
                                <UserAvatar row={row} />
                              </TableCell>
                              <TableCell>{formatDateTime(row.dateRegistered)}</TableCell>
                              <TableCell>{row.phoneNumber ?? "Not available"}</TableCell>
                              <TableCell>{row.email ?? "Not available"}</TableCell>
                              <TableCell>
                                <StatusText status={row.status} />
                              </TableCell>
                              <TableCell>
                                <ActionIcons onView={() => setSelectedUser(row)} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </>
                  ) : null}
                </Table>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm text-gray3">
                <span>
                  Page {usersPage.page} of {usersPage.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    title="Previous"
                    size="sm"
                    variant="primaryLight"
                    disabled={!usersPage.hasPreviousPage}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="w-auto"
                  />
                  <Button
                    title="Next"
                    size="sm"
                    disabled={!usersPage.hasNextPage}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="w-auto"
                  />
                </div>
              </div>
            </section>
          ) : (
            <section className="min-h-[840px] rounded-[16px] border border-gray5 bg-white p-5">
              <h3 className="text-xl font-medium leading-8 text-gray1">
                All Onboarding Request
              </h3>
              <p className="mt-5 text-sm font-medium leading-6 text-gray1">
                Filter table list by:
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-5">
                <SingleSelect
                  label="User type"
                  value="all"
                  onValueChange={() => {}}
                  options={[{ value: "all", label: "Select option" }]}
                  maxWidth="w-full md:w-[250px]"
                  className="rounded-[12px]"
                />
                <Input
                  label="Date verified"
                  type="date"
                  value=""
                  onChange={() => {}}
                  maxWidth="w-full md:w-[250px]"
                  className="rounded-[12px]"
                />
                <SingleSelect
                  label="Product category"
                  value="all"
                  onValueChange={() => {}}
                  options={[{ value: "all", label: "Select category" }]}
                  maxWidth="w-full md:w-[250px]"
                  className="rounded-[12px]"
                />
                <Button
                  title="Filter"
                  iconLeft={<Filter size={18} />}
                  className="h-[60px] w-full rounded-[12px] md:w-[250px]"
                  type="button"
                />
              </div>

              <div className="mt-7 overflow-hidden border-r border-gray6">
                <Table className="min-w-[1060px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User name</TableHead>
                      <TableHead>User type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Request date</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ONBOARDING_ROWS.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="min-w-[260px]">
                          <div className="flex items-center gap-3">
                            <span className="size-8 rounded-lg bg-[#D9D9D9]" />
                            {row.name}
                          </div>
                        </TableCell>
                        <TableCell>{row.userType}</TableCell>
                        <TableCell>
                          <StatusText status={row.status} />
                        </TableCell>
                        <TableCell>{row.requestDate}</TableCell>
                        <TableCell>{row.country}</TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setSelectedOnboarding(row)}
                            className="inline-flex items-center gap-2 text-success hover:text-success/80"
                          >
                            <Eye size={18} />
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}
        </div>
      </div>

      <PlatformUserDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
      <OnboardingDrawer
        request={selectedOnboarding}
        onClose={() => setSelectedOnboarding(null)}
      />
    </div>
  );
}
