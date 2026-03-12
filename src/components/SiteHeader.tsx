import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">Investigation Tool</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/subscribe">Subscription</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login" className="rounded border px-2 py-1">Login</Link>
        </nav>
      </div>
    </header>
  );
}
