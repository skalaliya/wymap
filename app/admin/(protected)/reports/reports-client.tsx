"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";

type Option = {
  id: string;
  name: string;
};

export default function ReportsClient({
  employees,
  sites,
}: {
  employees: Option[];
  sites: Option[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    const start = searchParams.get("start") ?? "";
    const end = searchParams.get("end") ?? "";
    const siteId = searchParams.get("siteId") ?? "";
    const employeeId = searchParams.get("employeeId") ?? "";
    return { start, end, siteId, employeeId };
  }, [searchParams]);

  const update = (next: Partial<typeof params>) => {
    const updated = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) updated.delete(key);
      else updated.set(key, value);
    });
    router.push(`/admin/reports?${updated.toString()}`);
  };

  const download = async () => {
    setLoading(true);
    try {
      notify("Generating CSV...", { variant: "info" });
      const response = await fetch(`/api/admin/reports?${searchParams.toString()}`);
      if (!response.ok) {
        notify("Failed to export report", { variant: "error" });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "wymap-report.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      notify("Report downloaded", { variant: "success" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          value={params.start}
          onChange={(event) => update({ start: event.target.value })}
        />
        <Input
          label="End date"
          type="date"
          value={params.end}
          onChange={(event) => update({ end: event.target.value })}
        />
        <Select
          label="Site"
          value={params.siteId}
          onChange={(event) => update({ siteId: event.target.value })}
        >
          <option value="">All sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </Select>
        <Select
          label="Employee"
          value={params.employeeId}
          onChange={(event) => update({ employeeId: event.target.value })}
        >
          <option value="">All employees</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--text-muted)]">
          Filters are stored in the URL for sharing and repeat exports.
        </p>
        <Button onClick={download} loading={loading}>
          Download CSV
        </Button>
      </div>
    </Card>
  );
}
