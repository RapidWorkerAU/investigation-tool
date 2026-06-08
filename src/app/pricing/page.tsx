import type { Metadata } from "next";
import PricingPageClient from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing | Investigation Tool",
  description:
    "Compare Investigation Tool free, 30 day, monthly and organisation access options.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
