import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvestigationCanvasPage({ params }: Props) {
  const { id } = await params;
  redirect(`/system-maps/${id}`);
}
