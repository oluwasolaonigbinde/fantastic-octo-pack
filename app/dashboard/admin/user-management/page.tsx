"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, Plus, Trash2 } from "lucide-react";
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

/* ------------------------------------------------------------------ */
/*  Mock data matching Figma                                           */
/* ------------------------------------------------------------------ */

const ADMIN_ROWS = Array.from({ length: 6 }).map((_, i) => ({
  id: `admin-${i + 1}`,
  name: "Oluwatunma, Olujobi Oluwole",
  email: "olayepabi@gmail.com",
  phone: "08000000000",
  status: "Active" as const,
  role: i < 4 ? "Super admin" : "Admin",
}));

const ROLE_ROWS = Array.from({ length: 5 }).map((_, i) => ({
  id: `role-${i + 1}`,
  name: "Super Admin",
  description:
    "See all dashboard charts, See all companies, Create companies, Edit, Combine, Generate reports",
  email: "olayepabi@gmail.com",
  users: 15,
  status: "Active" as const,
}));

type Tab = "users" | "roles";

export default function AdminUserManagementPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div>
      <Header
        title="User Management"
        description="View and create users, roles, and privileges"
      />

      <div className="space-y-8 p-4 md:p-6">
        {/* Top-level tabs */}
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

        {/* All Admin Users */}
        {tab === "users" && (
          <section className="card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="medium3 text-gray1">All Admin Users</h2>
                <p className="text-sm text-gray3">
                  View all admin users and create new user
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
                      <TableCell className="min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <span className="size-8 shrink-0 rounded-full bg-gray5" />
                          <span className="font-medium text-gray1">
                            {row.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-success">
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            className="text-primary hover:text-primary-dark"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="text-danger hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {/* All Roles and Permission */}
        {tab === "roles" && (
          <section className="card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="medium3 text-gray1">All Roles and Permission</h2>
                <p className="text-sm text-gray3">
                  View all and create new roles and permission
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role name / Permission</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLE_ROWS.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="min-w-[300px]">
                        <div>
                          <p className="font-medium text-gray1">{row.name}</p>
                          <p className="mt-0.5 text-xs text-gray3">
                            {row.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.users}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-success">
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            className="text-primary hover:text-primary-dark"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="text-danger hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </span>
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
  );
}
