import { LegalPageClient, type LegalSection } from "@/components/legal/LegalPageClient";

const sections: LegalSection[] = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance Of Terms",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi volutpat vulputate urna, sed consequat mi fermentum vitae. Integer vitae tristique nisi, at fermentum erat. Quisque sit amet est vel turpis condimentum porta.",
      "Suspendisse iaculis lorem ut luctus faucibus. Praesent tincidunt, nunc at faucibus pulvinar, arcu augue eleifend lorem, non feugiat purus lorem ut eros.",
      "Vivamus posuere interdum velit, at ullamcorper lectus laoreet nec. Integer pretium tincidunt sem, nec hendrerit erat tincidunt sed.",
    ],
  },
  {
    id: "user-obligations",
    title: "User Obligations",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer a tincidunt lorem. Donec sed dolor eget justo placerat efficitur. Praesent consequat posuere semper.",
      "Aenean tempus, nibh eget dictum dignissim, massa erat volutpat purus, non faucibus arcu sem in lorem. Sed cursus sapien eu bibendum placerat.",
      "Cras vulputate nisl eu volutpat faucibus. Integer viverra urna sit amet tristique interdum. Nulla facilisi.",
    ],
  },
  {
    id: "platform-usage",
    title: "Platform Usage",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ac sapien sem. Vivamus sit amet nisi sed lectus ultrices luctus in non neque.",
      "Sed tincidunt, magna quis tristique semper, lorem lectus dapibus risus, sit amet finibus erat tortor quis augue. Pellentesque luctus, lectus et dignissim blandit, ligula augue commodo turpis, nec faucibus mauris justo id dolor.",
      "Maecenas eget volutpat nunc. Fusce faucibus tortor et magna sagittis, sit amet pulvinar ipsum sollicitudin.",
    ],
  },
  {
    id: "billing-and-access",
    title: "Billing And Access",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vehicula erat vitae nisl tincidunt, nec malesuada risus placerat. Duis ultrices massa quis justo tincidunt vulputate.",
      "Pellentesque ac ipsum a ex ullamcorper faucibus. Integer porta justo ut erat tempus cursus. Donec pretium sodales nisi in laoreet.",
      "Nunc semper, nibh vitae feugiat consequat, sem turpis commodo nibh, a elementum ipsum turpis at velit.",
    ],
  },
  {
    id: "limitations-and-termination",
    title: "Limitations And Termination",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In pharetra tempor enim, nec laoreet lectus interdum sed. Donec sed lectus in sem egestas tempus nec sit amet metus.",
      "Etiam in pellentesque est. Pellentesque quis hendrerit est. Curabitur luctus erat vitae magna vestibulum, ut faucibus mauris feugiat.",
      "Donec tincidunt sapien eget arcu posuere, eu porttitor erat tempor. Nunc mattis libero in nibh rhoncus, ac suscipit lectus vulputate.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageClient
      pageTitle="Terms & Conditions"
      effectiveDate="March 13, 2026"
      sections={sections}
    />
  );
}
