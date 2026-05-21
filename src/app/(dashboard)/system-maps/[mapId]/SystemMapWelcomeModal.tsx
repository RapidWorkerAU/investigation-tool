"use client";

type SystemMapWelcomeModalProps = {
  open: boolean;
  isMobile?: boolean;
  onStartManual: () => void;
  onStartWizard: () => void;
};

const quickActions = [
  {
    title: "Add Component",
    description: "Use this to add investigation nodes, notes, images, tables, and other canvas items manually.",
    icon: "/icons/addcomponent.svg",
  },
  {
    title: "Wizard",
    description: "Start with guided questions and let Investigation Tool create grouped nodes for you.",
    icon: "/icons/wizard.svg",
  },
  {
    title: "Search",
    description: "Find linked documents and content in the investigation, then jump straight to where that item sits on the map.",
    icon: "/icons/finddocument.svg",
  },
  {
    title: "Zoom Tools",
    description: "Use zoom fit and reset zoom to quickly orient yourself on the canvas.",
    icon: "/icons/zoomfit.svg",
  },
  {
    title: "Print",
    description: "Create a PDF or print output from the current view or a selected area of the map.",
    icon: "/icons/printer.svg",
  },
  {
    title: "Map Info",
    description: "Open the information panel to review map details and access settings.",
    icon: "/icons/info.svg",
  },
] as const;

function QuickActionCard({
  title,
  description,
  icon,
  isMobile = false,
}: {
  title: string;
  description: string;
  icon: string;
  isMobile?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/90 shadow-[0_14px_28px_rgba(15,23,42,0.07)] ${
        isMobile ? "p-4" : "p-3.5"
      }`}
    >
      <div className={`flex items-start ${isMobile ? "gap-3" : "gap-2.5"}`}>
        <span
          aria-hidden="true"
          className={`mt-0.5 flex shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dbeafe_0%,#ede9fe_52%,#fce7f3_100%)] text-[#312e81] ${
            isMobile ? "h-11 w-11" : "h-10 w-10"
          }`}
        >
          <span
            className={`bg-current ${isMobile ? "h-5 w-5" : "h-5 w-5"}`}
            style={{
              WebkitMaskImage: `url('${icon}')`,
              maskImage: `url('${icon}')`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          <p className={`mt-1 text-sm text-slate-600 ${isMobile ? "leading-6" : "leading-5.5"}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SystemMapWelcomeModal({
  open,
  isMobile = false,
  onStartManual,
  onStartWizard,
}: SystemMapWelcomeModalProps) {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[122] ${isMobile ? "overflow-y-auto bg-white" : "flex items-center justify-center bg-[rgba(15,23,42,0.52)] px-4 py-6"}`}>
      <div
        className={`w-full overflow-hidden ${
          isMobile
            ? "min-h-full bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))]"
            : "max-w-[1240px] rounded-[30px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_34px_80px_rgba(15,23,42,0.28)]"
        }`}
      >
        <div className={`border-b border-slate-200/80 px-6 sm:px-8 ${isMobile ? "py-6" : "py-5"}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Welcome</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">Your new investigation map is ready</h2>
            <p className={`max-w-none text-sm text-slate-600 ${isMobile ? "mt-3 leading-6" : "mt-2.5 leading-6"}`}>
              You can build this map manually by adding nodes yourself, or you can use the wizard to scaffold the investigation
              with grouped sections and editable nodes. Everything created by the wizard remains fully editable on the canvas.
            </p>
          </div>
        </div>

        <div className={`px-6 sm:px-8 ${isMobile ? "py-6" : "py-5"}`}>
          <div className={`grid md:grid-cols-2 xl:grid-cols-3 ${isMobile ? "gap-4" : "gap-3.5"}`}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} isMobile={isMobile} {...action} />
            ))}
          </div>

          <div className={`border-t border-slate-200/80 ${isMobile ? "mt-6 pt-6" : "mt-5 pt-5"}`}>
            <h3 className="text-lg font-semibold text-slate-950">How would you like to start?</h3>
            <p className={`text-sm text-slate-600 ${isMobile ? "mt-2 leading-6" : "mt-1.5 leading-6"}`}>
              Choose manual if you already know what you want to place on the map. Choose wizard if you want Investigation Tool
              to guide you through the investigation sections and create the starting nodes for you.
            </p>
            {isMobile ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Some functions may not be available when using the investigation map on mobile. We recommend using desktop to access all functions.
              </p>
            ) : null}
            <div className={`flex flex-wrap gap-3 ${isMobile ? "mt-5" : "mt-4"}`}>
              <button
                type="button"
                onClick={onStartManual}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Start Manually
              </button>
              <button
                type="button"
                onClick={onStartWizard}
                className="rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(79,70,229,0.24)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1d4ed8_0%,#5b21b6_52%,#be185d_100%)]"
              >
                Start With Wizard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const guestQuickActions = [
  {
    title: "Move Around",
    description: "Click and drag on open canvas space to pan around the map. Use the zoom controls to fit the whole map or reset your view.",
    icon: "/icons/zoomfit.svg",
  },
  {
    title: "Open Details",
    description: "Double click a node, or click it once and press Configure in the floating toolbar at the top of the canvas, to open the left details panel.",
    icon: "/icons/info.svg",
  },
  {
    title: "Add Notes",
    description: "Use Add note, then click a clear spot on the canvas. Notes cannot overlap key nodes and may need admin approval before others see them.",
    icon: "/icons/comments.svg",
  },
  {
    title: "Find Items",
    description: "Use Search to find a node or map item by label, description, or type, then jump directly to that location.",
    icon: "/icons/finddocument.svg",
  },
] as const;

function formatGuestAccessDuration(hours: number | null) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) return "a limited time";
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

function formatGuestAccessExpiry(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-AU", {
    timeZone: "Australia/Perth",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

type GuestMapWelcomeModalProps = {
  open: boolean;
  isMobile?: boolean;
  viewerEmail: string | null;
  sessionDurationHours: number | null;
  sessionExpiresAt: string | null;
  onClose: () => void;
};

export function GuestMapWelcomeModal({
  open,
  isMobile = false,
  viewerEmail,
  sessionDurationHours,
  sessionExpiresAt,
  onClose,
}: GuestMapWelcomeModalProps) {
  if (!open) return null;
  const durationLabel = formatGuestAccessDuration(sessionDurationHours);
  const expiryLabel = formatGuestAccessExpiry(sessionExpiresAt);

  return (
    <div className={`fixed inset-0 z-[122] ${isMobile ? "overflow-y-auto bg-white" : "flex items-center justify-center bg-[rgba(15,23,42,0.52)] px-4 py-6"}`}>
      <div
        className={`w-full overflow-hidden ${
          isMobile
            ? "min-h-full bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))]"
            : "max-w-[1040px] rounded-[30px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_34px_80px_rgba(15,23,42,0.28)]"
        }`}
      >
        <div className={`border-b border-slate-200/80 px-6 sm:px-8 ${isMobile ? "py-6" : "py-5"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Welcome</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Explore the case study map</h2>
              <p className={`max-w-none text-sm text-slate-600 ${isMobile ? "mt-3 leading-6" : "mt-2.5 leading-6"}`}>
                This public map is read-only, but you can inspect the investigation structure, search for items, zoom around the canvas, and add notes for review.
                {viewerEmail ? ` You are viewing with ${viewerEmail}.` : ""}
              </p>
              <p className={`max-w-none text-sm text-slate-600 ${isMobile ? "mt-3 leading-6" : "mt-2 leading-6"}`}>
                Your access is valid for {durationLabel} from redemption
                {expiryLabel ? ` and is currently due to expire ${expiryLabel} AWST` : ""}. If you run out of time, request an extension from the person who issued your access code.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close welcome"
              className="inline-flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
              onClick={onClose}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 bg-current"
                style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </div>
        </div>

        <div className={`px-6 sm:px-8 ${isMobile ? "py-6" : "py-5"}`}>
          <div className={`grid md:grid-cols-2 ${isMobile ? "gap-4" : "gap-3.5"}`}>
            {guestQuickActions.map((action) => (
              <QuickActionCard key={action.title} isMobile={isMobile} {...action} />
            ))}
          </div>

          <div className={`border-t border-slate-200/80 ${isMobile ? "mt-6 pt-6" : "mt-5 pt-5"}`}>
            <h3 className="text-lg font-semibold text-slate-950">Start with the left menu</h3>
            <p className={`text-sm text-slate-600 ${isMobile ? "mt-2 leading-6" : "mt-1.5 leading-6"}`}>
              Search and Notes are in the left menu. Zoom fit and reset zoom help you re-centre the view after exploring a specific part of the map.
            </p>
            {isMobile ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                The map works best on desktop. Some detail panels and larger map sections may be harder to inspect on smaller screens.
              </p>
            ) : null}
            <div className={`flex flex-wrap gap-3 ${isMobile ? "mt-5" : "mt-4"}`}>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#102a43] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1f33]"
              >
                Start Exploring
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
