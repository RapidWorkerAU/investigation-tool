import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { LeadAccessForm } from "./LeadAccessForm";
import { fetchLeadMapCampaignBySlug, readLeadAccessSessionFromCookies } from "@/lib/leadAccess";

type LeadAccessPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LeadAccessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await fetchLeadMapCampaignBySlug(slug);
  if (!campaign || !campaign.is_active) {
    return { title: "Case Study Access" };
  }
  return {
    title: `${campaign.title} | Case Study Access`,
    description: campaign.description || "Redeem an access code to view the read-only case study map.",
  };
}

export default async function LeadAccessPage({ params }: LeadAccessPageProps) {
  const { slug } = await params;
  const campaign = await fetchLeadMapCampaignBySlug(slug);
  if (!campaign || !campaign.is_active) {
    notFound();
  }

  const cookieStore = await cookies();
  const session = readLeadAccessSessionFromCookies(cookieStore, campaign.slug);
  if (session && session.campaignId === campaign.id && session.mapId === campaign.map_id) {
    redirect(`/lead-map/${campaign.slug}`);
  }

  return <LeadAccessForm slug={campaign.slug} title={campaign.title} description={campaign.description} />;
}
