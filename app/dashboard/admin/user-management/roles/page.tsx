"use client";

import { AdminSectionPage } from "@/components/admin/AdminSectionPage";
import { Button } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

const ROLE_ROWS = [
  { id: "1", name: "Administrator", users: 2 },
  { id: "2", name: "Support", users: 1 },
] as const;

export default function AdminRolesPage() {
  return (
    <AdminSectionPage title="User Management" description="Roles and permissions">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="medium3 text-gray1">All roles and permission</h2>
        <Button
          title="Create role"
          iconLeft={<Plus size={16} />}
          className="w-auto"
          type="button"
        />
      </div>
      <section className="card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role name</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROLE_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.users}</TableCell>
                <TableCell className="text-right">
                  <Button title="Edit" variant="primaryLight" size="sm" className="w-auto" type="button" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </AdminSectionPage>
  );
}
