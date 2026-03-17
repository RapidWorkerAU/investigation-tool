import { emailTemplates } from "@/lib/email";
import EmailPreviewClient from "./EmailPreviewClient";

type PreviewCard = {
  key: string;
  title: string;
  subject: string;
  html: string;
  text: string;
};

const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`;
const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`;
const subscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/subscribe`;
const accountUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account`;

const previews: PreviewCard[] = [
  {
    key: "confirm-account",
    title: "Confirm account",
    ...emailTemplates.confirmAccount({ firstName: "Ashleigh", actionUrl: loginUrl }),
  },
  {
    key: "forgot-password",
    title: "Forgot password",
    ...emailTemplates.forgotPassword({ firstName: "Ashleigh", actionUrl: loginUrl }),
  },
  {
    key: "password-changed",
    title: "Password changed",
    ...emailTemplates.passwordChanged({ firstName: "Ashleigh", actionUrl: loginUrl }),
  },
  {
    key: "welcome",
    title: "Welcome",
    ...emailTemplates.welcome({ firstName: "Ashleigh", actionUrl: dashboardUrl }),
  },
  {
    key: "trial-started",
    title: "Trial started",
    ...emailTemplates.trialStarted({ firstName: "Ashleigh", endsAt: "2026-03-24T09:00:00Z", actionUrl: dashboardUrl }),
  },
  {
    key: "pass-30-started",
    title: "30 day access confirmed",
    ...emailTemplates.pass30Started({
      firstName: "Ashleigh",
      endsAt: "2026-04-16T09:00:00Z",
      actionUrl: dashboardUrl,
      amountLabel: "AUD 149.00",
    }),
  },
  {
    key: "subscription-started",
    title: "Subscription started",
    ...emailTemplates.subscriptionStarted({ firstName: "Ashleigh", renewalDate: "2026-04-16T09:00:00Z", actionUrl: dashboardUrl }),
  },
  {
    key: "subscription-renewed",
    title: "Subscription renewed",
    ...emailTemplates.subscriptionRenewed({ firstName: "Ashleigh", renewalDate: "2026-05-16T09:00:00Z", actionUrl: dashboardUrl }),
  },
  {
    key: "payment-failed",
    title: "Payment failed",
    ...emailTemplates.paymentFailed({ firstName: "Ashleigh", actionUrl: accountUrl }),
  },
  {
    key: "payment-receipt",
    title: "Payment receipt",
    ...emailTemplates.paymentReceipt({ firstName: "Ashleigh", amountLabel: "AUD 149.00", actionUrl: dashboardUrl }),
  },
  {
    key: "access-ending-soon",
    title: "Access ending in 3 business days",
    ...emailTemplates.accessEndingSoon({ firstName: "Ashleigh", endsAt: "2026-04-13T09:00:00Z", actionUrl: subscribeUrl }),
  },
  {
    key: "access-ends-today",
    title: "Access ends today",
    ...emailTemplates.accessEndsToday({ firstName: "Ashleigh", endsAt: "2026-04-16T09:00:00Z", actionUrl: subscribeUrl }),
  },
  {
    key: "access-expired",
    title: "Access expired",
    ...emailTemplates.accessExpired({ firstName: "Ashleigh", actionUrl: subscribeUrl }),
  },
];

export default function EmailPreviewPage() {
  return <EmailPreviewClient previews={previews} />;
}
