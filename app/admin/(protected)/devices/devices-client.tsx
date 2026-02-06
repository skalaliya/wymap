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
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";
import { updateTableParams, getPage, getPageSize } from "@/lib/admin-table";
import { useDebounce } from "@/lib/use-debounce";

type Site = {
  id: string;
  name: string;
};

type Device = {
  id: string;
  name: string;
  siteId: string;
  active: boolean;
  lastSeenAt: string | null;
};

type ApiResponse = {
  devices: Device[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export default function DevicesClient({ sites, canEdit }: { sites: Site[]; canEdit: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 400);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/devices?${searchParams.toString()}`);
    if (response.ok) {
      const json = (await response.json()) as ApiResponse;
      setData(json);
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    router.push(
      `/admin/devices?${updateTableParams(new URLSearchParams(searchParams.toString()), {
        search: debouncedSearch,
        page: 1,
      }).toString()}`,
    );
  }, [debouncedSearch, router, searchParams]);

  const createDevice = async () => {
    if (!name || !siteId) {
      notify("Device name and site required", { variant: "error" });
      return;
    }
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
    const response = await fetch("/api/admin/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({ name, siteId, active: true }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Failed to register device", { variant: "error" });
      return;
    }
    notify("Device registered", { variant: "success" });
    setName("");
    fetchDevices();
  };

  const toggleActive = async (device: Device) => {
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
    const response = await fetch(`/api/admin/devices/${device.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({ active: !device.active }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Failed to update device", { variant: "error" });
      return;
    }
    notify("Device updated", { variant: "success" });
    fetchDevices();
  };

  const page = getPage(new URLSearchParams(searchParams.toString()));
  const pageSize = getPageSize(new URLSearchParams(searchParams.toString()));
  const items = data?.devices ?? [];
  const total = data?.total ?? items.length;

  return (
    <Card className="space-y-4">
      <Toolbar>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            label="Search"
            placeholder="Search devices"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <Input label="Device" placeholder="Device name" value={name} onChange={(event) => setName(event.target.value)} />
            <Select label="Site" value={siteId} onChange={(event) => setSiteId(event.target.value)}>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
            <Button onClick={createDevice} loading={saving}>
              Register
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
        <p className="text-sm text-[var(--text-muted)]">No devices found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--surface-border)]">
          <Table className="min-w-[760px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Device</TableHeaderCell>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Last seen</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {items.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{sites.find((site) => site.id === device.siteId)?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={device.active ? "success" : "warning"}>
                      {device.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{device.lastSeenAt ?? "Never"}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmId(device.id)}
                        className="w-full sm:w-auto"
                      >
                        {device.active ? "Deactivate" : "Activate"}
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
          router.push(`/admin/devices?${updateTableParams(new URLSearchParams(searchParams.toString()), { page: next }).toString()}`)
        }
        onPageSizeChange={(next) =>
          router.push(
            `/admin/devices?${updateTableParams(new URLSearchParams(searchParams.toString()), { pageSize: next, page: 1 }).toString()}`,
          )
        }
      />
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Update device status?"
        description="Device status changes take effect immediately."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const device = items.find((item) => item.id === confirmId);
                if (device) toggleActive(device);
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
