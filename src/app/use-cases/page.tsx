import type { Metadata } from "next";
import UseCasesPageClient from "./UseCasesPageClient";

export const metadata: Metadata = {
  title: "Use cases | Investigation Tool",
  description:
    "See how Investigation Tool supports safety, operations, security, environment, people and structured investigation work.",
};

export default function UseCasesPage() {
  return <UseCasesPageClient />;
}
