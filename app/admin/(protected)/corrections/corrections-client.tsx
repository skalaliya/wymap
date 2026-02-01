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

type EventOption = {
  id: string;
  label: string;
  employeeId: string;
  siteId: string;
  deviceId: string;
};

type Correction = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  createdAt: string;
};

type ApiResponse = {
  corrections: Correction[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export default function CorrectionsClient({ events, canReview }: { events: EventOption[]; canReview: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalEventId, setOriginalEventId] = useState(events[0]?.id ?? "");
  const [type, setType] = useState<"IN" | "OUT" | "BREAK_START" | "BREAK_END">("IN");
  const [reason, setReason] = useState(searchParams.get("reason") ?? "");
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [confirm, setConfirm] = useState<{ id: string; status: "APPROVED" | "REJECTED" } | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 400);

  const fetchCorrections = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/corrections?${searchParams.toString()}`);
    if (response.ok) {
      const json = (await response.json()) as ApiResponse;
      setData(json);
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (eventId) {
      setOriginalEventId(eventId);
    }
  }, [searchParams]);

  useEffect(() => {
    router.push(
      `/admin/corrections?${updateTableParams(new URLSearchParams(searchParams.toString()), {
        search: debouncedSearch,
        page: 1,
      }).toString()}`,
    );
  }, [debouncedSearch, router, searchParams]);

  const submitCorrection = async () => {
    if (!originalEventId || !reason) {
      notify("Select event and provide reason", { variant: "error" });
      return;
    }
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
    const response = await fetch("/api/admin/corrections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({
        originalEventId,
        reason,
        type,
        occurredAt: new Date().toISOString(),
      }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Correction failed", { variant: "error" });
      return;
    }
    notify("Correction requested", { variant: "success" });
    setReason("");
    fetchCorrections();
  };

  const reviewCorrection = async (id: string, status: "APPROVED" | "REJECTED") => {
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
    const response = await fetch(`/api/admin/corrections/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Failed to update correction", { variant: "error" });
      return;
    }
    notify(`Correction ${status.toLowerCase()}`, { variant: "success" });
    fetchCorrections();
  };

  const page = getPage(new URLSearchParams(searchParams.toString()));
  const pageSize = getPageSize(new URLSearchParams(searchParams.toString()));
  const items = data?.corrections ?? [];
  const total = data?.total ?? items.length;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <Toolbar>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              label="Search"
              placeholder="Search corrections"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select label="Event" value={originalEventId} onChange={(event) => setOriginalEventId(event.target.value)}>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.label}
                </option>
              ))}
            </Select>
            <Select label="Type" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="BREAK_START">Break start</option>
              <option value="BREAK_END">Break end</option>
            </Select>
            <Input label="Reason" placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button onClick={submitCorrection} loading={saving}>
              Request
            </Button>
          </div>
        </Toolbar>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No corrections found.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Reason</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Requested</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {items.map((correction) => (
                  <TableRow key={correction.id}>
                    <TableCell>{correction.reason}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          correction.status === "APPROVED"
                            ? "success"
                            : correction.status === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {correction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(correction.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {canReview && correction.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => setConfirm({ id: correction.id, status: "APPROVED" })}>
                            Approve
                          </Button>
                          <Button variant="danger" onClick={() => setConfirm({ id: correction.id, status: "REJECTED" })}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">No actions</span>
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
            router.push(`/admin/corrections?${updateTableParams(new URLSearchParams(searchParams.toString()), { page: next }).toString()}`)
          }
          onPageSizeChange={(next) =>
            router.push(
              `/admin/corrections?${updateTableParams(new URLSearchParams(searchParams.toString()), { pageSize: next, page: 1 }).toString()}`,
            )
          }
        />
      </Card>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Confirm ${confirm?.status === "APPROVED" ? "approval" : "rejection"}?`}
        description="This will lock the correction status."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirm) reviewCorrection(confirm.id, confirm.status);
                setConfirm(null);
              }}
              loading={saving}
            >
              Confirm
            </Button>
          </>
        }
      />
    </div>
  );
}
