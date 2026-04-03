import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string }>;
};

export default async function InvestigationCanvasPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { welcome } = await searchParams;
  redirect(`/system-maps/${id}${welcome === "1" ? "?welcome=1" : ""}`);
}
