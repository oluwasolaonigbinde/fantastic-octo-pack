"use client";

/**
 * Distributor chooser for a targeted (direct-routed) RFQ.
 *
 * `POST /rfqs` takes `routingMode: "direct"` plus `directDistributorIds`, so
 * the buyer needs distributor ids — those come from the public directory
 * (`GET /public/profiles?roles=distributor`), the only read that lists
 * distributors to a buyer.
 */

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";

import { userService } from "@/services/userService";
import { UserRole, type PublicProfileData } from "@/types/user";
import { getPartyDisplayName } from "@/utils/partyDisplayName";

/** A distributor named up-front — e.g. by a "Request Quote" deep link. */
export interface PinnedDistributor {
  _id: string;
  name: string;
}

interface DistributorPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /**
   * Shown above the search results so a distributor the buyer arrived with is
   * visible even when the current search page does not contain them.
   */
  pinned?: PinnedDistributor[];
}

const profileName = (profile: PublicProfileData) =>
  getPartyDisplayName(profile, "Distributor");

export default function DistributorPicker({ selectedIds, onChange, pinned }: DistributorPickerProps) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<PublicProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await userService.getPublicProfiles(
          1,
          25,
          [UserRole.DISTRIBUTOR],
          search.trim() || undefined,
        );
        if (!cancelled) setProfiles(response.data.docs ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setProfiles([]);
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load distributors.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pinnedIds = useMemo(() => new Set((pinned ?? []).map((entry) => entry._id)), [pinned]);
  // The pinned rows are rendered separately; drop them from the search results
  // so the same distributor is not offered twice.
  const searchResults = useMemo(
    () => profiles.filter((profile) => !pinnedIds.has(profile._id)),
    [profiles, pinnedIds],
  );

  const toggle = (id: string) =>
    onChange(selected.has(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);

  return (
    <div className="space-y-3">
      {pinned?.length ? (
        <ul className="divide-y divide-gray6 rounded-lg border border-gray5">
          {pinned.map((entry) => {
            const isSelected = selected.has(entry._id);
            return (
              <li key={entry._id}>
                <button
                  type="button"
                  onClick={() => toggle(entry._id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-gray7 ${
                    isSelected ? "bg-primary-light/40" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray1">{entry.name}</span>
                    <span className="block text-xs text-gray3">Requested from their profile</span>
                  </span>
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded border ${
                      isSelected ? "border-primary bg-primary text-white" : "border-gray5"
                    }`}
                  >
                    {isSelected ? <Check size={13} /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <label className="relative block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray3" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search distributors by name"
          aria-label="Search distributors"
          className="h-12 w-full rounded-lg border border-gray5 pl-9 pr-3 text-sm text-gray1 placeholder:text-gray3"
        />
      </label>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray5">
        {isLoading ? (
          <p className="flex items-center justify-center gap-2 p-6 text-sm text-gray3">
            <Loader2 size={16} className="animate-spin" /> Loading distributors…
          </p>
        ) : error ? (
          <p className="p-6 text-center text-sm text-danger">{error}</p>
        ) : searchResults.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray3">No distributor matches that search.</p>
        ) : (
          <ul className="divide-y divide-gray6">
            {searchResults.map((profile) => {
              const isSelected = selected.has(profile._id);
              return (
                <li key={profile._id}>
                  <button
                    type="button"
                    onClick={() => toggle(profile._id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-gray7 ${
                      isSelected ? "bg-primary-light/40" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray1">
                        {profileName(profile)}
                      </span>
                      {profile.address ? (
                        <span className="block truncate text-xs text-gray3">{profile.address}</span>
                      ) : null}
                    </span>
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded border ${
                        isSelected ? "border-primary bg-primary text-white" : "border-gray5"
                      }`}
                    >
                      {isSelected ? <Check size={13} /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray3">
        {selectedIds.length === 0
          ? "Select at least one distributor to send this request directly."
          : `${selectedIds.length} distributor${selectedIds.length === 1 ? "" : "s"} selected.`}
      </p>
    </div>
  );
}
