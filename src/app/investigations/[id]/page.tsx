import Link from "next/link";

export default async function InvestigationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Investigation {id}</h1>
      <p>Detail page scaffold.</p>
      <Link href={`/investigations/${id}/canvas`} className="rounded bg-black px-3 py-2 text-white">
        Open Canvas
      </Link>
    </div>
  );
}
