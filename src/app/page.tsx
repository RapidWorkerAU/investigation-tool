import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Investigation Tool</h1>
      <p>Build, manage, and collaborate on investigation maps.</p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">Login / Create Account</Link>
        <Link href="/subscribe" className="rounded border px-4 py-2">Choose Subscription</Link>
      </div>
    </div>
  );
}
