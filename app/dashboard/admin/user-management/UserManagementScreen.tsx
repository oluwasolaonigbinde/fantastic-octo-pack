"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Archive, Edit2, Eye, Plus, Trash2 } from "lucide-react";

import Header from "../../component/header";
import { Button } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type UserManagementTab = "users" | "roles";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active";
  role: "Super admin" | "Admin" | "Compliance" | "Finance";
};

type RoleRow = {
  id: string;
  name: string;
  description: string;
  userCount: number;
  status: "Active";
};

const ADMIN_ROWS: AdminUserRow[] = [
  {
    id: "admin-1",
    name: "Oluwatunma Olujobi Oluwole",
    email: "olayepabi@gmail.com",
    phone: "08000000000",
    status: "Active",
    role: "Super admin",
  },
  {
    id: "admin-2",
    name: "Emmanuella Ifeanyi",
    email: "emmanuella.ifeanyi@buiy.com",
    phone: "08031112223",
    status: "Active",
    role: "Admin",
  },
  {
    id: "admin-3",
    name: "Samuel Smart",
    email: "samuel.smart@buiy.com",
    phone: "08037778889",
    status: "Active",
    role: "Compliance",
  },
  {
    id: "admin-4",
    name: "Amina Yusuf",
    email: "amina.yusuf@buiy.com",
    phone: "08045556667",
    status: "Active",
    role: "Finance",
  },
  {
    id: "admin-5",
    name: "Ibrahim Zainab",
    email: "ibrahim.zainab@buiy.com",
    phone: "08029994455",
    status: "Active",
    role: "Admin",
  },
  {
    id: "admin-6",
    name: "Abang Okon",
    email: "abang.okon@buiy.com",
    phone: "08052223334",
    status: "Active",
    role: "Super admin",
  },
];

const ROLE_ROWS: RoleRow[] = [
  {
    id: "role-1",
    name: "Super Admin",
    description:
      "See all dashboard charts, manage platform users, review disputes, and view analytics.",
    userCount: 8,
    status: "Active",
  },
  {
    id: "role-2",
    name: "Admin",
    description:
      "Manage users, listing reviews, service requests, and day-to-day operational actions.",
    userCount: 5,
    status: "Active",
  },
  {
    id: "role-3",
    name: "Compliance",
    description:
      "Review KYC submissions, verification outcomes, and platform compliance activity.",
    userCount: 3,
    status: "Active",
  },
  {
    id: "role-4",
    name: "Finance",
    description:
      "Monitor escrow, payment history, subscription billing, and settlement activity.",
    userCount: 2,
    status: "Active",
  },
  {
    id: "role-5",
    name: "Support",
    description:
      "Handle onboarding requests, account issues, and service follow-up activity.",
    userCount: 4,
    status: "Active",
  },
];

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EAF8FF] text-xs font-semibold text-primary">
      {initials}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-success">
      {status}
    </span>
  );
}

function IconActionButton({
  label,
  icon,
  href,
  tone = "primary",
}: {
  label: string;
  icon: ReactNode;
  href?: string;
  tone?: "primary" | "warning" | "danger";
}) {
  const className =
    tone === "warning"
      ? "text-[#F08A32] hover:text-[#d97706]"
      : tone === "danger"
        ? "text-danger hover:text-red-700"
        : "text-primary hover:text-primary-dark";

  const content = (
    <span
      className={`inline-flex size-8 items-center justify-center rounded-full transition ${className}`}
      title={label}
      aria-label={label}
    >
      {icon}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" aria-label={label} title={label}>
      {content}
    </button>
  );
}

function RoleUsersPreview({ count }: { count: number }) {
  const colors = ["#DDF7D8", "#D9EAFB", "#F8D9D4", "#FDF1CC"];

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-8 w-[76px] items-center">
        {colors.map((color, index) => (
          <span
            key={`${color}-${index}`}
            className="absolute top-0 size-8 rounded-full border border-white"
            style={{ left: index * 16, backgroundColor: color }}
          />
        ))}
      </div>
      <span className="inline-flex rounded-full bg-[#E7F1FF] px-2 py-0.5 text-[11px] font-medium text-primary">
        +{count}
      </span>
    </div>
  );
}

export function UserManagementScreen({
  initialTab = "users",
}: {
  initialTab?: UserManagementTab;
}) {
  const [tab, setTab] = useState<UserManagementTab>(initialTab);

  return (
    <div>
      <Header
        title="User Management"
        description="View and create users, roles, and privileges"
      />

      <div className="space-y-8 p-4 md:p-6">
        <div className="flex rounded-xl border border-gray5 bg-white p-1">
          {(
            [
              ["users", "All Admin Users"],
              ["roles", "All Roles and Permission"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-lg py-3 text-center text-sm font-semibold transition ${
                tab === key
                  ? "bg-primary text-white"
                  : "text-gray2 hover:text-gray1"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "users" ? (
          <section className="card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="medium3 text-gray1">All Admin Users</h2>
                <p className="text-sm text-gray3">
                  View all admin users and create new users.
                </p>
              </div>
              <Link href="/dashboard/admin/user-management/add-user">
                <Button
                  title="Add New User"
                  iconLeft={<Plus size={16} />}
                  className="w-auto shrink-0"
                  type="button"
                />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Users name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ADMIN_ROWS.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={row.name} />
                          <span className="font-medium text-gray1">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <IconActionButton label="Edit user" icon={<Edit2 size={16} />} />
                          <IconActionButton
                            label="Delete user"
                            icon={<Trash2 size={16} />}
                            tone="danger"
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {tab === "roles" ? (
          <section className="card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="medium3 text-gray1">All Roles and Permission</h2>
                <p className="text-sm text-gray3">
                  View all roles and create new roles and permissions.
                </p>
              </div>
              <Link href="/dashboard/admin/user-management/roles/create">
                <Button
                  title="Create New Role"
                  iconLeft={<Plus size={16} />}
                  className="w-auto shrink-0"
                  type="button"
                />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray5">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[54%]">Role name / Permission</TableHead>
                    <TableHead className="w-[9%]">Email</TableHead>
                    <TableHead className="w-[15%]">Users</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[12%]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLE_ROWS.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="min-w-[420px] py-6">
                        <div className="space-y-1">
                          <p className="font-medium text-gray1">{row.name}</p>
                          <p className="max-w-[540px] text-xs leading-5 text-gray3">
                            {row.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 text-gray3">-</TableCell>
                      <TableCell className="py-6">
                        <RoleUsersPreview count={row.userCount} />
                      </TableCell>
                      <TableCell className="py-6">
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="inline-flex items-center gap-2">
                          <IconActionButton
                            label="Archive role"
                            icon={<Archive size={16} />}
                            tone="warning"
                          />
                          <IconActionButton label="Edit role" icon={<Edit2 size={16} />} />
                          <IconActionButton
                            label="View role"
                            icon={<Eye size={16} />}
                            href="/dashboard/admin/user-management/roles"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

