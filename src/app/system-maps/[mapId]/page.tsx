import type { Metadata, Viewport } from "next";
import SystemMapCanvasClient from "./SystemMapCanvasClient";

type MapPageProps = {
  params: Promise<{ mapId: string }>;
  searchParams: Promise<{ welcome?: string }>;
};

export const metadata: Metadata = {
  title: "Management System Map",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function SystemMapPage({ params, searchParams }: MapPageProps) {
  const { mapId } = await params;
  const { welcome } = await searchParams;

  return <SystemMapCanvasClient mapId={mapId} showWelcomeOnLoad={welcome === "1"} />;
}
