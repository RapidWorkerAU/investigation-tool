import { LegalPageClient, type LegalSection } from "@/components/legal/LegalPageClient";

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "1. Who We Are",
    paragraphs: [
      "This Privacy Policy applies to the Investigation Tool platform, which is owned and managed by HSES Industry Partners and operated by the legal entity listed below.",
      "Legal Entity: AL & JP Pty Ltd. Trading As: HSES Industry Partners. ABN: 27 617 956 215. Location: Gidgegannup, Western Australia 6083, Australia. Contact: support@investigationtool.com.au.",
      "We provide an online platform that allows users to visually map investigation information, including timelines, contributing factors, and findings.",
    ],
  },
  {
    id: "what-this-policy-covers",
    title: "2. What This Policy Covers",
    paragraphs: [
      "This Privacy Policy explains how we collect, use, store, and protect your information when you use our investigation tool service.",
      "It applies to all users globally.",
    ],
  },
  {
    id: "information-we-collect",
    title: "3. Information We Collect",
    paragraphs: [],
    subsections: [
      {
        id: "account-information",
        title: "3.1 Account Information",
        paragraphs: [
          "When you create an account, we collect your name, email address, and password. Passwords are securely stored and encrypted. You must verify your email address before accessing the service.",
        ],
      },
      {
        id: "user-generated-content",
        title: "3.2 User-Generated Content",
        paragraphs: [
          "You may choose to upload or create content within the platform, including investigation notes and written statements, images and uploaded files, reports or supporting documentation, and visual investigation mapping data such as timelines, factors, and findings. This content is entirely controlled by you.",
        ],
      },
      {
        id: "payment-information",
        title: "3.3 Payment Information",
        paragraphs: [
          "All payments are processed securely via Stripe. We do not collect or store credit card details or billing card information. Stripe manages payment processing, subscription management, and billing details.",
        ],
      },
      {
        id: "system-and-technical-data",
        title: "3.4 System and Technical Data",
        paragraphs: [
          "We may collect limited technical data required for system operation, such as login activity and basic usage data needed for functionality and performance. We do not use third-party analytics platforms such as Google Analytics.",
        ],
      },
    ],
  },
  {
    id: "sensitive-information-disclaimer",
    title: "4. Sensitive Information Disclaimer",
    paragraphs: [
      "This platform is not intended to store personal identifying information about individuals involved in incidents, health or injury information, or sensitive personal data. However, users may choose to enter such information at their own discretion.",
      "By using the service, you acknowledge that you are responsible for the content you upload, you must ensure compliance with applicable privacy and workplace laws, and you should avoid entering sensitive personal data unless necessary and appropriately managed.",
    ],
  },
  {
    id: "how-we-use-your-information",
    title: "5. How We Use Your Information",
    paragraphs: [
      "We use your information strictly to provide and operate the service, authenticate users and manage accounts, enable investigation data creation and storage, process subscriptions and manage access, and send account-related communications.",
      "We do not sell your data, use your data for advertising, or send marketing emails.",
    ],
  },
  {
    id: "emails-and-communications",
    title: "6. Emails & Communications",
    paragraphs: [
      "We send only essential service-related emails.",
      "We do not send marketing communications.",
    ],
    lists: [[
      "Account verification",
      "Password resets",
      "Subscription confirmations",
      "Payment status notifications",
      "Access expiry or renewal notices",
    ]],
  },
  {
    id: "data-storage-and-infrastructure",
    title: "7. Data Storage & Infrastructure",
    paragraphs: [
      "We use trusted third-party providers to operate the service.",
      "Your data may be stored and processed in countries outside Australia. By using the service, you consent to this international data transfer.",
    ],
    lists: [[
      "Database and storage: Supabase (hosted in Seoul, South Korea)",
      "Hosting and deployment: Vercel",
      "Code repository: GitHub",
      "Email delivery: Resend",
      "Payments: Stripe",
    ]],
  },
  {
    id: "data-security",
    title: "8. Data Security",
    paragraphs: [
      "We implement reasonable technical and organisational measures to protect your data.",
      "While we take security seriously, no system is completely immune to risk.",
    ],
    lists: [[
      "Encrypted data transmission (HTTPS)",
      "Secure authentication processes",
      "Platform-level security provided by our infrastructure providers",
    ]],
  },
  {
    id: "data-sharing",
    title: "9. Data Sharing",
    paragraphs: [
      "We do not sell, rent, or trade your data.",
      "We only share data with our service providers listed in this policy strictly to operate the platform, process payments, and deliver system functionality. These providers are contractually required to handle data securely.",
    ],
  },
  {
    id: "data-retention-and-deletion",
    title: "10. Data Retention & Deletion",
    paragraphs: [
      "You have full control over your data.",
    ],
    subsections: [
      {
        id: "account-deletion",
        title: "10.1 Account Deletion",
        paragraphs: [
          "You may delete your account at any time. When you do, your account is permanently deleted, all associated data is permanently removed, and the action is immediate and cannot be reversed.",
        ],
      },
      {
        id: "investigation-data",
        title: "10.2 Investigation Data",
        paragraphs: [
          "You may delete investigation records individually at any time. Deleted data is permanently removed from our system, is not recoverable, and we do not retain backup copies for user recovery purposes.",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "11. Cookies",
    paragraphs: [
      "We do not use advanced tracking or advertising cookies.",
      "Only minimal cookies may be used where required for authentication and basic platform functionality.",
    ],
  },
  {
    id: "your-rights",
    title: "12. Your Rights",
    paragraphs: [
      "Depending on your location, you may have rights to access your personal data, correct inaccurate information, delete your data, and restrict or object to processing.",
      "Because our system is user-controlled, most of these rights can be exercised directly within the platform.",
      "For additional requests, contact support@investigationtool.com.au.",
    ],
  },
  {
    id: "international-users",
    title: "13. International Users",
    paragraphs: [
      "This service is available globally.",
      "By using the platform, you acknowledge that your data may be transferred to and processed in countries outside your own, including South Korea.",
    ],
  },
  {
    id: "children",
    title: "14. Children",
    paragraphs: [
      "This service is not intended for individuals under 18.",
      "We do not knowingly collect data from children. If you believe a minor has created an account, please contact us and we will remove the data.",
    ],
  },
  {
    id: "changes-to-this-policy",
    title: "15. Changes To This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time.",
      "When we do, the updated version will be posted on this page and the Last Updated date will be revised.",
    ],
  },
  {
    id: "contact-us",
    title: "16. Contact Us",
    paragraphs: [
      "For any privacy-related questions or requests:",
      "Email: support@investigationtool.com.au",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageClient
      pageTitle="Privacy Policy"
      effectiveDate="20 March 2026"
      sections={sections}
    />
  );
}
