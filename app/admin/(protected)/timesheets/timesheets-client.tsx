/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Toolbar } from "@/components/ui/Toolbar";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";
import { updateTableParams, getPage, getPageSize } from "@/lib/admin-table";
import { formatTime } from "@/lib/date";

type Shift = {
  start: string;
  end: string | null;
  minutes: number;
};

type Row = {
  employee: { id: string; name: string };
  shifts: Shift[];
  anomalies: string[];
  isOnsite: boolean;
  suggestedEventId: string | null;
};

type ApiResponse = {
  rows: Row[];
  page: number;
  pageSize: number;
  total: number;
  date: string;
};

const filters = [
  { value: "all", label: "All" },
  { value: "onsite", label: "On site now" },
  { value: "missing-out", label: "Missing checkout" },
];

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function TimesheetsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateValue, setDateValue] = useState(searchParams.get("date") ?? "");

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/timesheets?${searchParams.toString()}`);
    if (response.ok) {
      const json = (await response.json()) as ApiResponse;
      setData(json);
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const page = getPage(new URLSearchParams(searchParams.toString()));
  const pageSize = getPageSize(new URLSearchParams(searchParams.toString()));
  const filter = searchParams.get("filter") ?? "all";

  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);

  return (
    <Card className="space-y-4">
      <Toolbar>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            label="Date"
            type="date"
            value={dateValue}
            onChange={(event) => {
              setDateValue(event.target.value);
              router.push(
                `/admin/timesheets?${updateTableParams(new URLSearchParams(searchParams.toString()), {
                  page: 1,
                }).toString()}&date=${event.target.value}`,
              );
            }}
          />
          <Select
            label="Filter"
            value={filter}
            onChange={(event) =>
              router.push(
                `/admin/timesheets?${updateTableParams(new URLSearchParams(searchParams.toString()), {
                  filter: event.target.value === "all" ? null : event.target.value,
                  page: 1,
                }).toString()}`,
              )
            }
          >
            {filters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          {data?.date ? `Showing ${new Date(data.date).toDateString()}` : "Loading date..."}
        </div>
      </Toolbar>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No timesheet data for this date.</p>
      ) : (
        <TableContainer>
          <Table className="min-w-[900px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Shifts</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Anomalies</TableHeaderCell>
                <TableHeaderCell>Resolve</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {rows.map((row) => {
                const totalMinutes = row.shifts.reduce((acc, shift) => acc + shift.minutes, 0);
                return (
                  <TableRow key={row.employee.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{row.employee.name}</p>
                        {row.isOnsite ? <Badge variant="success">On site</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-[var(--text-muted)]">
                        {row.shifts.map((shift, index) => (
                          <p key={`${row.employee.id}-${index}`}>
                            {formatTime(new Date(shift.start))} – {shift.end ? formatTime(new Date(shift.end)) : "Open"}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{totalMinutes ? formatDuration(totalMinutes) : "—"}</TableCell>
                    <TableCell>
                      {row.anomalies.length ? (
                        <div className="flex flex-wrap gap-2">
                          {row.anomalies.map((anomaly) => (
                            <Badge key={anomaly} variant="warning">
                              {anomaly}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.anomalies.length && row.suggestedEventId ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            notify("Redirecting to corrections...", { variant: "info" });
                            router.push(
                              `/admin/corrections?eventId=${row.suggestedEventId}&reason=Missing%20punch`,
                            );
                          }}
                        >
                          Resolve
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </TableContainer>
      )}
      <Pagination
        page={data?.page ?? page}
        pageSize={data?.pageSize ?? pageSize}
        total={data?.total ?? 0}
        onPageChange={(next) =>
          router.push(`/admin/timesheets?${updateTableParams(new URLSearchParams(searchParams.toString()), { page: next }).toString()}`)
        }
        onPageSizeChange={(next) =>
          router.push(
            `/admin/timesheets?${updateTableParams(new URLSearchParams(searchParams.toString()), { pageSize: next, page: 1 }).toString()}`,
          )
        }
      />
    </Card>
  );
}
