import { LegalPageClient, type LegalSection } from "@/components/legal/LegalPageClient";

const sections: LegalSection[] = [
  {
    id: "acceptance-of-terms",
    title: "1. Acceptance of Terms",
    paragraphs: [
      "These Terms of Use govern your access to and use of the Investigation Tool service operated by AL & JP Pty Ltd, trading as HSES Industry Partners, ABN 27 617 956 215.",
      "By accessing or using the service, you agree to be bound by these Terms.",
      "If you do not agree, you must not use the service.",
    ],
  },
  {
    id: "nature-of-the-service",
    title: "2. Nature of the Service",
    paragraphs: [
      "The service provides a digital platform that enables users to visually map investigation information, including timelines, contributing factors, findings, and supporting materials.",
      "You are solely responsible for how the service is used.",
    ],
    lists: [[
      "The service is a tool for structuring information only",
      "The service does not provide legal, compliance, or investigation advice",
      "The service does not validate, verify, or assess the accuracy of user content",
    ]],
  },
  {
    id: "eligibility-and-authority",
    title: "3. Eligibility and Authority",
    paragraphs: [
      "You must be at least 18 years old to use the service.",
      "By using the service, you confirm the following matters.",
    ],
    lists: [[
      "You are authorised to use the service in your professional or personal capacity",
      "You have the authority to upload and manage any data entered into the platform",
    ]],
  },
  {
    id: "user-accounts-and-security",
    title: "4. User Accounts and Security",
    paragraphs: [
      "You must register using a valid email address and verify your email before accessing the service.",
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity conducted under your account.",
      "We are not liable for unauthorised access resulting from your failure to secure your account.",
    ],
  },
  {
    id: "subscription-and-payments",
    title: "5. Subscription and Payments",
    paragraphs: [
      "Access to the service may be provided via a free trial, fixed-term access, or an ongoing subscription.",
      "All payments are processed via Stripe.",
      "Failure to pay may result in suspension or termination of access.",
    ],
    lists: [[
      "We do not store payment card details",
      "We do not control billing infrastructure",
      "You are responsible for maintaining valid payment details",
      "You are responsible for managing subscription changes or cancellations",
    ]],
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable Use",
    paragraphs: [
      "You must use the service in a lawful and responsible manner.",
      "You must not engage in the following conduct.",
    ],
    lists: [[
      "Use the service for unlawful, fraudulent, or harmful activities",
      "Upload or transmit malicious code or harmful content",
      "Attempt to gain unauthorised access to systems or data",
      "Interfere with the operation or security of the service",
    ]],
  },
  {
    id: "investigation-data-and-user-responsibility",
    title: "7. Investigation Data and User Responsibility",
    paragraphs: [],
    subsections: [
      {
        id: "user-controlled-content-environment",
        title: "7.1 User-Controlled Content Environment",
        paragraphs: [
          "The service provides a user-controlled environment for structuring investigation-related information.",
          "We do not monitor user content, do not validate or verify information, and do not control how information is entered or interpreted.",
        ],
      },
      {
        id: "data-classification-and-responsibility",
        title: "7.2 Data Classification and Responsibility",
        paragraphs: [
          "You are solely responsible for determining what information is appropriate to upload, ensuring all data is handled in accordance with applicable laws, contractual obligations, and internal policies, and ensuring you have lawful authority to use and store any data entered into the platform.",
        ],
      },
      {
        id: "prohibited-and-high-risk-data-use",
        title: "7.3 Prohibited and High-Risk Data Use",
        paragraphs: [
          "The service is not designed or intended to store or manage personally identifiable information relating to incident participants, health or injury information, legally privileged or confidential investigation material, or sensitive workplace or regulatory investigation records requiring controlled systems.",
          "If you choose to upload such information, you do so entirely at your own risk, you accept full responsibility for compliance with all applicable obligations, and you acknowledge that the service does not provide safeguards designed for sensitive or regulated data environments.",
        ],
      },
      {
        id: "no-duty-of-care-for-investigation-outcomes",
        title: "7.4 No Duty of Care for Investigation Outcomes",
        paragraphs: [
          "We do not provide investigation methodology, ensure compliance with regulatory frameworks, or influence or validate investigation outcomes. All investigation outputs, conclusions, and decisions remain the responsibility of the user.",
        ],
      },
    ],
  },
  {
    id: "data-ownership-and-platform-rights",
    title: "8. Data Ownership and Platform Rights",
    paragraphs: [
      "You retain full ownership of all content you create or upload.",
      "You grant us a limited right to store, process, and transmit your data solely to operate the service.",
      "We do not sell your data or use your data for marketing.",
    ],
  },
  {
    id: "data-deletion-and-irrecoverability",
    title: "9. Data Deletion and Irrecoverability",
    paragraphs: [
      "You may delete individual investigation data at any time and delete your account at any time.",
      "Deletion is immediate, permanent, and irreversible.",
      "We do not retain recoverable backups for user-initiated deletions.",
      "You acknowledge that you are responsible for retaining any records required outside the platform.",
    ],
  },
  {
    id: "service-availability-and-changes",
    title: "10. Service Availability and Changes",
    paragraphs: [
      "We do not guarantee continuous availability, uninterrupted access, or error-free operation.",
      "The service may be modified, updated, or temporarily unavailable at any time without notice.",
    ],
  },
  {
    id: "third-party-infrastructure",
    title: "11. Third-Party Infrastructure",
    paragraphs: [
      "The service relies on third-party providers including Supabase, Vercel, GitHub, Resend, and Stripe.",
      "We are not responsible for downtime, data loss, or security incidents arising from these providers.",
    ],
  },
  {
    id: "intellectual-property",
    title: "12. Intellectual Property",
    paragraphs: [
      "All rights in the platform, excluding user content, including its design, functionality, structure, and branding, are owned by AL & JP Pty Ltd.",
      "You must not copy, reproduce, reverse engineer the platform, or use the platform to build a competing product.",
    ],
  },
  {
    id: "disclaimer",
    title: "13. Disclaimer",
    paragraphs: [
      "The service is provided as is and as available.",
      "To the maximum extent permitted by law, we make no warranties regarding accuracy, reliability, or fitness for purpose, and we do not guarantee compliance with any legal or regulatory framework.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "14. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, we are not liable for loss of data, business interruption, loss of revenue or profit, indirect or consequential damages, or decisions made using the service.",
      "Where liability cannot be excluded, it is limited to the total amount paid by you for the service in the 12 months preceding the claim.",
    ],
  },
  {
    id: "indemnity",
    title: "15. Indemnity",
    paragraphs: [
      "You agree to indemnify and hold harmless AL & JP Pty Ltd from any claims, losses, or liabilities arising from your use of the service, your data and content, your breach of these Terms, or any failure to comply with applicable laws or obligations.",
    ],
  },
  {
    id: "suspension-and-termination",
    title: "16. Suspension and Termination",
    paragraphs: [
      "We may suspend or terminate your access if you breach these Terms or if your use creates risk to the platform or other users.",
      "You may terminate your account at any time.",
    ],
  },
  {
    id: "governing-law",
    title: "17. Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of Western Australia, Australia.",
      "You submit to the jurisdiction of the courts of Western Australia.",
    ],
  },
  {
    id: "changes-to-terms",
    title: "18. Changes to Terms",
    paragraphs: [
      "We may update these Terms at any time.",
      "Continued use of the service constitutes acceptance of updated Terms.",
    ],
  },
  {
    id: "contact",
    title: "19. Contact",
    paragraphs: [
      "support@investigationtool.com.au",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageClient
      pageTitle="Terms & Conditions"
      effectiveDate="20 March 2026"
      sections={sections}
    />
  );
}
