import { LegalPageClient, type LegalSection } from "@/components/legal/LegalPageClient";

const sections: LegalSection[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet magna finibus, fermentum massa eu, cursus turpis. Integer sodales, tellus et volutpat faucibus, sapien elit vulputate lacus, at tincidunt massa purus non odio.",
      "Curabitur interdum, odio ac blandit ultricies, augue neque sodales nibh, sed bibendum orci ipsum nec risus. Sed gravida, velit id feugiat placerat, dui orci bibendum lorem, nec aliquet nibh eros et erat.",
      "Morbi faucibus justo at risus accumsan, a volutpat mauris malesuada. Donec cursus sem sed nibh interdum, ut porttitor purus luctus.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut magna ac erat facilisis tincidunt. Phasellus ac tristique dolor. Nam hendrerit luctus ligula, at pharetra enim faucibus sed.",
      "Suspendisse tempus sapien et massa aliquet, non iaculis arcu facilisis. Donec lacinia eros eu sem rhoncus, in posuere sapien volutpat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
      "Praesent nec mi non sem porttitor sodales. Integer efficitur gravida ligula, quis volutpat dui tempor nec.",
    ],
  },
  {
    id: "sharing-and-disclosure",
    title: "Sharing And Disclosure",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas congue, mauris ac facilisis pulvinar, lacus ipsum placerat turpis, sit amet ultrices ipsum urna non mauris.",
      "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec faucibus dignissim lacus, ut iaculis libero malesuada sed. Etiam luctus viverra ligula, vitae volutpat arcu finibus quis.",
      "Donec eget ligula vel lorem vulputate imperdiet. Sed feugiat lacus non lectus vulputate, non porttitor risus iaculis.",
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit elit vel nulla eleifend, at tristique risus consequat. Integer pellentesque justo ac mauris sodales, id auctor lorem aliquet.",
      "Aliquam semper orci id est tincidunt pretium. Nunc ut justo non odio malesuada tincidunt. Vestibulum vulputate faucibus risus, vel ultricies nunc molestie nec.",
      "Nam rutrum elit in sem gravida, vitae consequat risus porta. In et quam suscipit, pellentesque massa ut, malesuada est.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum non volutpat lacus. Proin ac sodales erat. Etiam imperdiet consequat tellus, non malesuada risus suscipit ac.",
      "Mauris aliquet, lacus a feugiat faucibus, odio nulla porta lectus, eu blandit libero ligula non mauris. Ut pretium pharetra dui, vitae egestas orci posuere vitae.",
      "Fusce bibendum risus vitae lacus ultrices, vitae feugiat nisl fermentum. Cras sed lectus sed nibh vulputate pellentesque.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageClient
      pageTitle="Privacy Policy"
      effectiveDate="March 13, 2026"
      sections={sections}
    />
  );
}
