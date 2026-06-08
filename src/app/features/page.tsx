import type { Metadata } from "next";
import FeaturesPageClient from "./FeaturesPageClient";

export const metadata: Metadata = {
  title: "Features | Investigation Tool",
  description:
    "Explore the Investigation Tool feature set for incident mapping, evidence, guided setup, reports, templates and access controls.",
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
