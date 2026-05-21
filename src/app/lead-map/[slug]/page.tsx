import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import SystemMapCanvasClient from "@/app/(dashboard)/system-maps/[mapId]/SystemMapCanvasClient";
import {
  fetchLeadAccessCodeById,
  fetchLeadMapCampaignBySlug,
  fetchLeadMapSnapshot,
  readLeadAccessSessionFromCookies,
} from "@/lib/leadAccess";

type LeadMapPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LeadMapPageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await fetchLeadMapCampaignBySlug(slug);
  if (!campaign || !campaign.is_active) {
    return { title: "Read-only Map" };
  }
  return {
    title: `${campaign.title} | Read-only Map`,
    description: campaign.description || "Read-only case study map",
  };
}

export default async function LeadMapPage({ params }: LeadMapPageProps) {
  const { slug } = await params;
  const campaign = await fetchLeadMapCampaignBySlug(slug);
  if (!campaign || !campaign.is_active) {
    notFound();
  }

  const cookieStore = await cookies();
  const session = readLeadAccessSessionFromCookies(cookieStore, campaign.slug);
  if (!session || session.campaignId !== campaign.id || session.mapId !== campaign.map_id) {
    redirect(`/case-study/${campaign.slug}`);
  }

  const code = await fetchLeadAccessCodeById(session.codeId);
  if (
    !code ||
    code.campaign_id !== campaign.id ||
    code.revoked_at ||
    !code.redeemed_at ||
    !code.redeemed_email ||
    code.redeemed_email !== session.redeemedEmail
  ) {
    redirect(`/case-study/${campaign.slug}`);
  }

  const snapshot = await fetchLeadMapSnapshot(campaign.map_id);
  if (!snapshot) {
    notFound();
  }

  return (
    <SystemMapCanvasClient
      mapId={campaign.map_id}
      viewerMode="guest"
      initialSnapshot={snapshot}
      guestSessionEmail={session.redeemedEmail}
      guestCampaignSlug={campaign.slug}
      guestAccessCodeId={session.codeId}
      guestSessionDurationHours={campaign.session_duration_hours}
      guestSessionExpiresAt={session.expiresAt}
    />
  );
}
