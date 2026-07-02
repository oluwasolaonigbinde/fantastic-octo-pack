"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Eye, Filter, ShieldCheck } from "lucide-react";

import Header from "@/app/dashboard/component/header";
import { Button, Input, RightSlider, SingleSelect, SummaryCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@/components/base";
import {
  useAdminKycDetailQuery,
  useAdminKycListQuery,
  useAdminKycStatsQuery,
  useApproveKycMutation,
  useRejectKycMutation,
} from "@/hooks/queries/kyc";
import { type AdminKycFilters } from "@/services/kycService";
import { getKycFileTypeLabel } from "@/utils/kycFileTypeLabel";


const statusColor: Record<string, string> = {
  Pending: "text-warning",
  Approved: "text-success",
  Rejected: "text-danger",
};

const humanizeFieldName = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());

export default function AdminKycManagement() {
  const [filters, setFilters] = useState<AdminKycFilters>({
    status: "all",
    userCategory: "all",
    date: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const statsQuery = useAdminKycStatsQuery();
  const listQuery = useAdminKycListQuery(filters);
  const detailQuery = useAdminKycDetailQuery(selectedId, {
    enabled: drawerOpen && Boolean(selectedId),
  });
  const approveMutation = useApproveKycMutation();
  const rejectMutation = useRejectKycMutation();

  const stats = statsQuery.data ?? null;
  const rows = listQuery.data ?? [];
  const loading = listQuery.isLoading || statsQuery.isLoading;
  const listError = listQuery.isError
    ? listQuery.error instanceof Error
      ? listQuery.error.message
      : "Unable to load KYC management"
    : null;

  const selected = detailQuery.data ?? null;
  const drawerLoading = detailQuery.isLoading || approveMutation.isPending;
  const rejecting = rejectMutation.isPending;
  const drawerError =
    detailQuery.isError
      ? detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "Unable to fetch KYC submission"
      : approveMutation.isError
        ? approveMutation.error instanceof Error
          ? approveMutation.error.message
          : "Unable to approve submission"
        : rejectMutation.isError
          ? rejectMutation.error instanceof Error
            ? rejectMutation.error.message
            : "Unable to reject submission"
          : null;

  const summaryValues = useMemo(
    () => ({
      totalVerifiedUsers: String(stats?.totalVerifiedUsers ?? 0).padStart(2, "0"),
      pendingKycReviews: String(stats?.pendingKycReviews ?? 0).padStart(2, "0"),
      rejectedSubmissions: String(stats?.rejectedSubmissions ?? 0).padStart(2, "0"),
      verificationFlagged: String(stats?.verificationFlagged ?? 0).padStart(2, "0"),
    }),
    [stats],
  );

  const openSubmission = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const approve = () => {
    if (!selected) return;
    approveMutation.mutate(selected._id);
  };

  const reject = () => {
    if (!selected || !rejectionReason.trim()) return;

    rejectMutation.mutate(
      { id: selected._id, rejectionReason: rejectionReason.trim() },
      {
        onSuccess: () => {
          setShowRejectForm(false);
          setRejectionReason("");
        },
      },
    );
  };

  return (
    <div>
      <Header title="KYC Management" description="Verify all KYC levels and view logs" />

      <div className="space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total verified users"
            value={summaryValues.totalVerifiedUsers}
            icon={<ShieldCheck size={18} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
            subtitle="For this month"
          />
          <SummaryCard
            title="Pending KYC reviews"
            value={summaryValues.pendingKycReviews}
            icon={<Clock size={18} className="text-[#C04FE0]" />}
            iconBg="bg-[#F8E8FF]"
            subtitle="For this month"
          />
          <SummaryCard
            title="Rejected submissions"
            value={summaryValues.rejectedSubmissions}
            icon={<AlertTriangle size={18} className="text-[#F6B90A]" />}
            iconBg="bg-[#FFF5DB]"
            subtitle="For this month"
          />
          <SummaryCard
            title="Verification flagged"
            value={summaryValues.verificationFlagged}
            icon={<CheckCircle2 size={18} className="text-danger" />}
            iconBg="bg-[#FFE8E8]"
            subtitle="For this month"
          />
        </div>

        <section className="card space-y-4">
          <div>
            <h3 className="medium3 text-gray1">All KYC Verification Requests</h3>
            <p className="text-sm text-gray3">
              View all requests from buyers/distributors/OEMs/engineers
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">
            Filter table list by:
          </p>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <SingleSelect
              label="Status"
              value={filters.status}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, status: value as AdminKycFilters["status"] }))
              }
              options={[
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
            <SingleSelect
              label="User category"
              value={filters.userCategory}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  userCategory: value as AdminKycFilters["userCategory"],
                }))
              }
              options={[
                { value: "all", label: "All categories" },
                { value: "buyer", label: "Buyer" },
                { value: "distributor", label: "Distributor" },
                { value: "oem", label: "OEM" },
                { value: "engineer", label: "Service Engineer" },
              ]}
            />
            <Input
              label="Date"
              type="date"
              value={filters.date}
              onChange={(event) =>
                setFilters((current) => ({ ...current, date: event.target.value }))
              }
            />
            <Button
              title="Filter"
              iconLeft={<Filter size={16} />}
              className="self-end"
              type="button"
              onClick={() => void listQuery.refetch()}
            />
          </div>

          {listError ? <p className="text-sm text-danger">{listError}</p> : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full name</TableHead>
                  <TableHead>KYC level</TableHead>
                  <TableHead>Document submitted</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Registration date</TableHead>
                  <TableHead className="hidden md:table-cell">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading KYC submissions…</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No KYC submissions yet</TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="min-w-[130px] md:min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <span className="hidden size-8 shrink-0 rounded-full bg-gray5 md:block" />
                          <span className="font-medium text-gray1">{row.fullName || row.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.kycLevel}</TableCell>
                      <TableCell>{row.documentSubmitted}</TableCell>
                      <TableCell className="hidden md:table-cell">{row.role}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`text-xs font-medium ${statusColor[row.status] ?? "text-gray3"}`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{row.registrationDate ? new Date(row.registrationDate).toLocaleDateString("en-GB") : "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Button
                          title="View"
                          variant="primaryLight"
                          size="sm"
                          iconLeft={<Eye size={14} />}
                          className="w-auto"
                          onClick={() => void openSubmission(row._id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <RightSlider open={drawerOpen} onClose={() => setDrawerOpen(false)} title="KYC request details">
        {drawerLoading ? <p>Loading…</p> : null}
        {drawerError ? <p className="text-sm text-danger">{drawerError}</p> : null}
        {selected ? (
          <div className="space-y-5 pb-6">
            <div className="rounded-2xl bg-[#F8FAFC] p-4">
              <p className="text-sm text-gray3">Request Status</p>
              <p className={`mt-2 text-base font-semibold ${statusColor[selected.requestStatusLabel] ?? "text-gray1"}`}>
                {selected.requestStatusLabel}
              </p>
            </div>

            <div className="space-y-3">
              <p><span className="font-medium">Full name:</span> {selected.user ? `${selected.user.firstName} ${selected.user.lastName}`.trim() : "-"}</p>
              <p><span className="font-medium">KYC level:</span> {selected.tierLabel}</p>
              <p><span className="font-medium">Role:</span> {selected.user?.role || selected.userRole}</p>
              <p><span className="font-medium">Registration date:</span> {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-GB") : "-"}</p>
            </div>

            {Object.entries(selected.textFields || {}).length ? (
              <div className="space-y-2">
                <p className="font-medium text-gray1">Submitted information</p>
                {Object.entries(selected.textFields).map(([key, value]) => (
                  <p key={key} className="text-sm text-gray2">
                    <span className="font-medium">{humanizeFieldName(key)}:</span> {value}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="font-medium text-gray1">Document submitted</p>
              {selected.documents.length === 0 ? (
                <p className="text-sm text-gray3">No documents uploaded for this request.</p>
              ) : (
                selected.documents.map((document) => (
                  <div key={document.fieldName} className="rounded-xl border border-gray5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray1">{document.fileName}</p>
                        <p className="text-sm text-gray3">
                          {getKycFileTypeLabel(document.fileType, document.fileName)}
                        </p>
                      </div>
                      <a href={document.fileUrl} target="_blank" rel="noreferrer" className="text-primary">
                        Download
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selected.rejectionReason ? (
              <div className="rounded-2xl bg-[#FFF0F0] p-4 text-sm text-danger">
                <p className="font-semibold">Reason for rejection</p>
                <p className="mt-2">{selected.rejectionReason}</p>
              </div>
            ) : null}

            {selected.status === "submitted" ? (
              <div className="space-y-3">
                {showRejectForm ? (
                  <div className="space-y-3">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-gray1">Reason for rejection</span>
                      <Textarea
                        label="Reason for rejection"
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                      />
                    </label>
                    {!rejectionReason.trim() ? (
                      <p className="text-sm text-gray3">
                        Enter a reason before confirming rejection.
                      </p>
                    ) : null}
                    <Button
                      title="Confirm rejection"
                      variant="secondary"
                      isBusy={rejecting}
                      disabled={!rejectionReason.trim()}
                      onClick={() => void reject()}
                    />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button title="Approve" onClick={() => void approve()} />
                    <Button
                      title="Reject"
                      variant="primaryLight"
                      onClick={() => setShowRejectForm(true)}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </RightSlider>
    </div>
  );
}
