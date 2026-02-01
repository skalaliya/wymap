export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <div className="surface space-y-4">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-sm text-[var(--text-muted)]">
          You do not have permission to view this page. Contact your
          administrator if you believe this is an error.
        </p>
      </div>
    </main>
  );
}
