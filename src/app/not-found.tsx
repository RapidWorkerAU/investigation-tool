import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <h1 className="text-2xl font-semibold">404</h1>
      <p>Page not found.</p>
      <Link href="/" className="underline">Go home</Link>
    </div>
  );
}
