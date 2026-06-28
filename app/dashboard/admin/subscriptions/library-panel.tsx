"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";

import { Spinner } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import subscriptionService from "@/services/subscriptionService";
import type { FeatureDefinition } from "@/types/subscription";

/** Value-type badge colours, shared with the plan editor. */
const FEATURE_TYPE_BADGE: Record<string, string> = {
  boolean: "bg-[#F3E8FF] text-[#7E22CE]",
  limit: "bg-[#E7F1FF] text-[#0669D9]",
  metered: "bg-[#FFF5DB] text-[#B07A00]",
};

const humanizeKey = (key: string) => {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Library tab — lists the platform feature catalog. Features are code-defined
 * and read-only, so there is no status, edit, or create action here; the panel
 * simply surfaces each feature's name, description and value type.
 */
export function LibraryPanel({ token }: { token?: string }) {
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await subscriptionService.fetchFeatureCatalog(token);
        if (!ignore) setFeatures(res.data.docs);
      } catch (e) {
        if (!ignore)
          setError(e instanceof Error ? e.message : "Failed to load features.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, [token, reloadKey]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return features;
    return features.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        (f.description ?? "").toLowerCase().includes(term) ||
        f.key.toLowerCase().includes(term),
    );
  }, [features, search]);

  return (
    <section className="card space-y-5 p-3 md:p-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-[320px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray3"
          />
          <input
            type="text"
            placeholder="Search features…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray5 pl-9 pr-3 text-sm text-gray1 outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg border border-gray5 text-gray3"
            aria-label="Export"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="flex size-10 items-center justify-center rounded-lg border border-gray5 text-gray3"
            aria-label="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading && features.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray5 py-16 text-center text-gray3">
          No features found.
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table with wrapping description */}
          <div className="hidden rounded-2xl border border-gray5 md:block">
            <Table>
              <TableHeader className="[&_tr]:bg-[#F3F4F6]">
                <TableRow>
                  <TableHead className="w-[28%]">Feature name</TableHead>
                  <TableHead className="w-[52%]">Feature description</TableHead>
                  <TableHead className="w-[20%]">Value type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((feature) => (
                  <TableRow key={feature.key}>
                    <TableCell className="whitespace-normal py-4 align-top font-medium text-gray1">
                      {feature.name}
                    </TableCell>
                    <TableCell className="whitespace-normal py-4 align-top text-gray2">
                      {feature.description ?? "—"}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <span
                        className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${
                          FEATURE_TYPE_BADGE[feature.type] ?? "bg-gray6 text-gray2"
                        }`}
                      >
                        {humanizeKey(feature.type)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((feature) => (
              <div
                key={feature.key}
                className="rounded-2xl border border-gray5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray1">{feature.name}</p>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
                      FEATURE_TYPE_BADGE[feature.type] ?? "bg-gray6 text-gray2"
                    }`}
                  >
                    {humanizeKey(feature.type)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray2">
                  {feature.description ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-sm text-gray3">
        {rows.length === 0
          ? "No results"
          : `Showing ${rows.length.toLocaleString()} feature${rows.length === 1 ? "" : "s"}`}
      </div>
    </section>
  );
}

export default LibraryPanel;
