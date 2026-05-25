import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string; from?: string }>;
};

export default async function InvestigationCanvasPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { welcome, from } = await searchParams;
  const query = new URLSearchParams();
  if (welcome === "1") query.set("welcome", "1");
  if (from === "case-studies") {
    query.set("from", "case-studies");
    query.set("caseStudy", "1");
  }
  const queryString = query.toString();
  redirect(`/system-maps/${id}${queryString ? `?${queryString}` : ""}`);
}
