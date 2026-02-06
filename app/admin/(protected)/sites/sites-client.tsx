/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Toolbar } from "@/components/ui/Toolbar";
import { useToast } from "@/components/ui/ToastProvider";
import { updateTableParams, getPage, getPageSize } from "@/lib/admin-table";
import { useDebounce } from "@/lib/use-debounce";

type Site = {
  id: string;
  name: string;
  timeZone: string;
  active: boolean;
};

type ApiResponse = {
  sites: Site[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export default function SitesClient({ canEdit }: { canEdit: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState("UTC");
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 400);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/sites?${searchParams.toString()}`);
    if (response.ok) {
      const json = (await response.json()) as ApiResponse;
      setData(json);
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    router.push(
      `/admin/sites?${updateTableParams(new URLSearchParams(searchParams.toString()), {
        search: debouncedSearch,
        page: 1,
      }).toString()}`,
    );
  }, [debouncedSearch, router, searchParams]);

  const createSite = async () => {
    if (!name) {
      notify("Site name required", { variant: "error" });
      return;
    }
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
    const response = await fetch("/api/admin/sites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({ name, timeZone, active: true }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Failed to create site", { variant: "error" });
      return;
    }
    notify("Site created", { variant: "success" });
    setName("");
    fetchSites();
  };

  const toggleActive = async (site: Site) => {
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
    const response = await fetch(`/api/admin/sites/${site.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({ active: !site.active }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Failed to update site", { variant: "error" });
      return;
    }
    notify("Site updated", { variant: "success" });
    fetchSites();
  };

  const page = getPage(new URLSearchParams(searchParams.toString()));
  const pageSize = getPageSize(new URLSearchParams(searchParams.toString()));
  const items = data?.sites ?? [];
  const total = data?.total ?? items.length;

  return (
    <Card className="space-y-4">
      <Toolbar>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            label="Search"
            placeholder="Search sites"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <Input label="Name" placeholder="Site name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Time zone" placeholder="UTC" value={timeZone} onChange={(event) => setTimeZone(event.target.value)} />
            <Button onClick={createSite} loading={saving}>
              Add site
            </Button>
          </div>
        ) : null}
      </Toolbar>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No sites found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--surface-border)]">
          <Table className="min-w-[640px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Time zone</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {items.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>{site.name}</TableCell>
                  <TableCell>{site.timeZone}</TableCell>
                  <TableCell>
                    <Badge variant={site.active ? "success" : "warning"}>
                      {site.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmId(site.id)}
                        className="w-full sm:w-auto"
                      >
                        {site.active ? "Deactivate" : "Activate"}
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">View only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <Pagination
        page={data?.page ?? page}
        pageSize={data?.pageSize ?? pageSize}
        total={total}
        onPageChange={(next) =>
          router.push(`/admin/sites?${updateTableParams(new URLSearchParams(searchParams.toString()), { page: next }).toString()}`)
        }
        onPageSizeChange={(next) =>
          router.push(
            `/admin/sites?${updateTableParams(new URLSearchParams(searchParams.toString()), { pageSize: next, page: 1 }).toString()}`,
          )
        }
      />
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Update site status?"
        description="This change is tracked in audit logs."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const site = items.find((item) => item.id === confirmId);
                if (site) toggleActive(site);
                setConfirmId(null);
              }}
              loading={saving}
            >
              Confirm
            </Button>
          </>
        }
      />
    </Card>
  );
}
