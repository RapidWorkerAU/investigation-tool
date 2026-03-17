import EmailPreviewClient from "./EmailPreviewClient";
import { buildEmailPreviews } from "@/lib/email/preview";

export default function EmailPreviewPage() {
  return <EmailPreviewClient previews={buildEmailPreviews()} />;
}
