import Link from "next/link";
import type { Metadata } from "next";

type HelpPageProps = {
  searchParams: Promise<{ category?: string }>;
};

type HelpSection = {
  id: string;
  title: string;
  intro: string;
  bullets: string[];
};

const categoryCopy = {
  document_map: {
    label: "Document Map",
    summary: "Best when you want to link documents, systems, process elements, and supporting context on one canvas.",
  },
  bow_tie: {
    label: "Bow Tie",
    summary: "Best when you need to map hazards, threats, consequences, controls, escalation factors, and recovery measures.",
  },
  incident_investigation: {
    label: "Investigation Map",
    summary: "Best when you want to structure an investigation from sequence and task conditions through evidence, findings, and recommendations.",
  },
  org_chart: {
    label: "Org Chart",
    summary: "Best when you want to map reporting lines, teams, and role ownership.",
  },
  process_flow: {
    label: "Process Flow",
    summary: "Best when you need freeform process mapping with shapes, text, systems, tables, and directional flow.",
  },
} as const;

const categoryFeatureMap = {
  document_map: ["Documents", "Systems", "Processes", "People", "Categories", "Groups", "Sticky notes", "Images", "Text boxes", "Tables"],
  bow_tie: ["Hazards", "Top events", "Threats", "Consequences", "Controls", "Escalation factors", "Recovery measures", "Degradation indicators", "Risk rating", "People", "Groups", "Images", "Text boxes"],
  incident_investigation: [
    "Documents",
    "Processes",
    "Categories",
    "Groups",
    "People",
    "Sticky notes",
    "Images",
    "Text boxes",
    "Tables",
    "Sequence steps",
    "Outcomes",
    "Task / condition",
    "Factors",
    "System factors",
    "Controls / barriers",
    "Evidence",
    "Findings",
    "Recommendations",
  ],
  org_chart: ["People", "Categories", "Groups", "Images", "Text boxes"],
  process_flow: ["Categories", "Groups", "Text boxes", "Images", "Documents", "Sticky notes", "Processes", "Systems", "Tables", "Rectangles", "Circles", "Pills", "Pentagons", "Chevrons", "Arrows"],
} as const;

const sections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    intro: "The canvas gives you two ways to begin building a map.",
    bullets: [
      "Use the wizard when you want the tool to scaffold an investigation structure for you.",
      "Use Add Component when you already know which items you want to place manually.",
      "The map title in the black header is editable for map owners with full write access.",
      "Use the access badge in the header to confirm whether the current map is read, partial write, or full write.",
    ],
  },
  {
    id: "adding-components",
    title: "Adding Components",
    intro: "The Add Component control opens the main canvas palette.",
    bullets: [
      "Components are grouped by category so users do not need to scroll through every item at once.",
      "What appears in the palette changes by map type, so the available options on an investigation map will differ from a bow tie or process flow map.",
      "Common content items include sticky notes, images, text boxes, and tables.",
      "After placing a component, click it to open its property panel and refine the content.",
    ],
  },
  {
    id: "editing-and-relationships",
    title: "Editing And Relationships",
    intro: "Most map work happens through the element side panels and relationship flows.",
    bullets: [
      "Click a node or canvas element to open its properties and edit its content, styling, or metadata.",
      "Add relationships from an item to link documents, systems, groups, and other supported targets.",
      "Relationship details can include mode, type, discipline, and a definition so the line means something explicit.",
      "Evidence items support media viewing so attachments can be reviewed in context.",
    ],
  },
  {
    id: "navigation-search-and-print",
    title: "Navigation, Search And Print",
    intro: "The canvas includes several tools for moving around large maps and preparing outputs.",
    bullets: [
      "Use search to find matching documents or content and jump straight to that item on the map.",
      "Use fit view and reset zoom when you need to reorient quickly.",
      "Use Print to export either the current view or a selected area.",
      "Print is best treated as an output tool after you have arranged the map the way you want it presented.",
    ],
  },
  {
    id: "map-information-and-access",
    title: "Map Information And Access",
    intro: "The information button in the header opens the map information panel.",
    bullets: [
      "Owners with full write access can update the map name, code, and description.",
      "The same panel shows map access so owners can review who has read, partial write, or full write permissions.",
      "If your billing or access status blocks editing, the canvas will switch to a read only state.",
      "Sticky note editing may still be available in limited cases even when broader editing is restricted.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Canvas Map Help",
};

function normaliseCategory(value: string | undefined) {
  if (!value) return "document_map" as const;
  if (value in categoryCopy) return value as keyof typeof categoryCopy;
  return "document_map" as const;
}

export default async function CanvasMapHelpPage({ searchParams }: HelpPageProps) {
  const resolvedSearchParams = await searchParams;
  const category = normaliseCategory(resolvedSearchParams.category);
  const activeCategory = categoryCopy[category];
  const activeFeatures = categoryFeatureMap[category];

  return (
    <main className="dashboard-main">
      <section className="dashboard-section">
        <div className="diagnostic-container">
          <Link href="/dashboard" className="dashboard-back-link">
            <span aria-hidden="true">←</span>
            Back to dashboard
          </Link>

          <div className="dashboard-page-header dashboard-page-header--flush">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Canvas Help</p>
            <h1>Investigation Tool canvas map reference</h1>
            <p className="dashboard-page-helper">
              This page is a practical reference for the canvas map. Use it to understand where key tools live, how common actions work,
              and which component types apply to the current map category.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_320px]">
            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#102a43_55%,#1d4ed8_100%)] px-8 py-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Current Category</p>
              <h2 className="mt-3 text-3xl font-semibold">{activeCategory.label}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{activeCategory.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {activeFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-100"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <aside className="dashboard-panel h-fit gap-4 rounded-[24px]">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">On This Page</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Jump to the section you need instead of reading this like a manual.</p>
              </div>
              <nav className="grid gap-2 text-sm">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </aside>
          </div>

          <div className="mt-8 grid gap-6">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="rounded-[24px] border border-slate-200 bg-white px-7 py-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="max-w-4xl">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Section</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.intro}</p>
                </div>
                <div className="mt-5 grid gap-3">
                  {section.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-[24px] border border-slate-200 bg-white px-7 py-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended Use</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">How I would keep improving this</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                Keep this page as the durable reference and avoid turning the welcome modal into a long document.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                Add screenshots or annotated UI callouts next so each section shows users where to click.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                Add contextual links later from the wizard, print menu, relationship panels, and evidence viewer back into this help page.
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
