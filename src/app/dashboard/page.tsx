import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-2">
        <Link className="rounded border bg-white p-3" href="/investigations/1">Investigation #1</Link>
        <Link className="rounded border bg-white p-3" href="/account">Edit Account</Link>
        <Link className="rounded border bg-white p-3" href="/account/export">Download User Content</Link>
        <Link className="rounded border bg-white p-3" href="/account/delete">Delete Account</Link>
      </div>
    </div>
  );
}
