import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { freeAccessModeEnabled } from "@/lib/freeAccessMode";
import PricingPageClient from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing | Investigation Tool",
  description:
    "Compare Investigation Tool free, 30 day, monthly and organisation access options.",
};

export default function PricingPage() {
  if (freeAccessModeEnabled) {
    redirect("/");
  }

  return <PricingPageClient />;
}
