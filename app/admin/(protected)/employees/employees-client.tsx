/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { withParams } from "@/lib/search-params";
import { useDebounce } from "@/lib/use-debounce";
"use client";

import { useState } from "react";
import { useCsrfToken } from "@/app/admin/(protected)/components/use-csrf-token";

type Employee = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  badgeId: string | null;
};

type ApiResponse = {
  items: Employee[];
  page: number;
  pageSize: number;
  total: number;
};

const statusOptions = ["all", "ACTIVE", "INACTIVE"] as const;

export default function EmployeesClient({ canEdit }: { canEdit: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [confirm, setConfirm] = useState<{ id: string; action: "deactivate" | "rotate" } | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 400);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/employees?${searchParams.toString()}`);
    if (response.ok) {
      const json = (await response.json()) as ApiResponse;
      setData(json);
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const next = withParams(
        new URLSearchParams(searchParams.toString()),
        updates,
      );
      router.push(`/admin/employees?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    updateParams({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, updateParams]);

  const handleStatus = (value: string) => {
    updateParams({ status: value === "all" ? null : value, page: 1 });
  };

  const createEmployee = async () => {
    if (!formName) {
      notify("Name required", { variant: "error" });
      return;
    }
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
type Props = {
  initialEmployees: Employee[];
  canEdit: boolean;
};

export default function EmployeesClient({ initialEmployees, canEdit }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [name, setName] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const csrfToken = useCsrfToken();

  const createEmployee = async () => {
    if (!csrfToken) return;
    const response = await fetch("/api/admin/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({ name: formName, badgeId: formBadge || undefined, status: "ACTIVE" }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Failed to create employee", { variant: "error" });
      return;
    }
    notify("Employee created", { variant: "success" });
    setFormName("");
    setFormBadge("");
    fetchEmployees();
  };

  const toggleStatus = async (employee: Employee) => {
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        name,
        badgeId: badgeId || undefined,
        status: "ACTIVE",
      }),
    });

    if (!response.ok) {
      setMessage("Failed to create employee.");
      return;
    }

    const data = await response.json();
    setEmployees((prev) => [...prev, data.employee]);
    setName("");
    setBadgeId("");
    setMessage("Employee created.");
  };

  const toggleStatus = async (employee: Employee) => {
    if (!csrfToken) return;
    const nextStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const response = await fetch(`/api/admin/employees/${employee.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({
        status: employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    });
    setSaving(false);
    if (!response.ok) {
      notify("Status update failed", { variant: "error" });
      return;
    }
    notify("Employee status updated", { variant: "success" });
    fetchEmployees();
  };

  const rotateToken = async (employee: Employee) => {
    setSaving(true);
    const tokenRes = await fetch("/api/csrf");
    const { token } = await tokenRes.json();
    const response = await fetch(`/api/admin/employees/${employee.id}/rotate-token`, {
      method: "POST",
      headers: {
        "x-csrf-token": token,
      },
    });
    setSaving(false);
    if (!response.ok) {
      notify("Token rotation failed", { variant: "error" });
      return;
    }
    const json = await response.json();
    notify("New token generated", { description: json.token, variant: "success" });
  };

  const page = getPage(new URLSearchParams(searchParams.toString()));
  const pageSize = getPageSize(new URLSearchParams(searchParams.toString()));
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const statusFilter = searchParams.get("status") ?? "all";

  const sortedItems = useMemo(
    () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <Toolbar>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              label="Search"
              placeholder="Search employees"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <Select label="Status" value={statusFilter} onChange={(event) => handleStatus(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All" : option}
                </option>
              ))}
            </Select>
          </div>
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-3">
              <Input label="Name" placeholder="Employee name" value={formName} onChange={(event) => setFormName(event.target.value)} />
              <Input label="Badge" placeholder="Badge ID" value={formBadge} onChange={(event) => setFormBadge(event.target.value)} />
              <Button onClick={createEmployee} loading={saving}>
                Add employee
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
        ) : sortedItems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No employees found.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Badge</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {sortedItems.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.badgeId ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "ACTIVE" ? "success" : "warning"}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setConfirm({ id: employee.id, action: "deactivate" })}
                            disabled={saving}
                          >
                            {employee.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setConfirm({ id: employee.id, action: "rotate" })}
                            disabled={saving}
                          >
                            Rotate token
                          </Button>
                        </div>
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
          total={data?.total ?? 0}
          onPageChange={(next) =>
            router.push(`/admin/employees?${updateTableParams(new URLSearchParams(searchParams.toString()), { page: next }).toString()}`)
          }
          onPageSizeChange={(next) =>
            router.push(`/admin/employees?${updateTableParams(new URLSearchParams(searchParams.toString()), { pageSize: next, page: 1 }).toString()}`)
          }
        />
      </Card>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "rotate" ? "Rotate employee token?" : "Update employee status?"}
        description="This action will be logged and applied immediately."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={() => {
                const employee = sortedItems.find((item) => item.id === confirm?.id);
                if (!employee || !confirm) return;
                if (confirm.action === "rotate") {
                  rotateToken(employee);
                } else {
                  toggleStatus(employee);
                }
                setConfirm(null);
              }}
            >
              Confirm
            </Button>
          </>
        }
      />
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setMessage("Failed to update status.");
      return;
    }

    const data = await response.json();
    setEmployees((prev) =>
      prev.map((item) => (item.id === employee.id ? data.employee : item)),
    );
    setMessage("Status updated.");
  };

  const rotateToken = async (employeeId: string) => {
    if (!csrfToken) return;
    const response = await fetch(
      `/api/admin/employees/${employeeId}/rotate-token`,
      {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
      },
    );

    if (!response.ok) {
      setMessage("Failed to rotate token.");
      return;
    }

    const data = await response.json();
    setMessage(`New token generated: ${data.token}`);
  };

  return (
    <div className="space-y-6">
      {canEdit ? (
        <div className="surface space-y-4">
          <h2 className="text-xl font-semibold">Add employee</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              placeholder="Employee name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              placeholder="Badge ID (optional)"
              value={badgeId}
              onChange={(event) => setBadgeId(event.target.value)}
            />
            <button
              className="rounded-lg bg-[var(--violet-1)]/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
              type="button"
              onClick={createEmployee}
            >
              Create
            </button>
          </div>
          {message ? <p className="text-sm">{message}</p> : null}
        </div>
      ) : null}

      <div className="surface space-y-4">
        <h2 className="text-xl font-semibold">Active employees</h2>
        <div className="space-y-3 text-sm text-[var(--text-muted)]">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="text-[var(--foreground)]">{employee.name}</p>
                <p>Badge: {employee.badgeId ?? "None"}</p>
                <p>Status: {employee.status}</p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-[var(--surface-border)] px-3 py-2"
                    type="button"
                    onClick={() => toggleStatus(employee)}
                  >
                    {employee.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="rounded-lg border border-[var(--surface-border)] px-3 py-2"
                    type="button"
                    onClick={() => rotateToken(employee.id)}
                  >
                    Rotate token
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
