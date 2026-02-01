"use client";

import { useState } from "react";
import { useCsrfToken } from "@/app/admin/(protected)/components/use-csrf-token";

type Employee = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  badgeId: string | null;
};

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
