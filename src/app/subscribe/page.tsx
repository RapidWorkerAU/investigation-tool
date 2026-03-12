import Link from "next/link";

export default function SubscribePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Choose Subscription</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="font-semibold">Basic</h2>
          <p className="text-sm text-slate-600">Starter plan</p>
          <Link href="/checkout?plan=basic" className="mt-3 inline-block rounded bg-black px-3 py-2 text-white">Choose Basic</Link>
        </div>
        <div className="rounded border bg-white p-4">
          <h2 className="font-semibold">Pro</h2>
          <p className="text-sm text-slate-600">Teams and advanced workflows</p>
          <Link href="/checkout?plan=pro" className="mt-3 inline-block rounded bg-black px-3 py-2 text-white">Choose Pro</Link>
        </div>
      </div>
    </div>
  );
}
