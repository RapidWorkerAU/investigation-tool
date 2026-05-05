import styles from "./ReportProgressLoadingView.module.css";

type ReportProgressLoadingViewProps = {
  phase: number;
  title: string;
  subtitle: string;
  helperText?: string;
  inline?: boolean;
  activityLog?: string[];
  progressPercent?: number;
  statusText?: string;
};

const steps = [
  { progress: 0, text: "Opening the report workspace." },
  { progress: 18, text: "Checking access and gathering investigation data." },
  { progress: 36, text: "Organising people, timeline, and findings." },
  { progress: 54, text: "Linking evidence files and preview sources." },
  { progress: 72, text: "Composing structured report sections." },
  { progress: 90, text: "Preparing PDF rendering and controls." },
  { progress: 100, text: "Final checks done. Ready to review." },
];

export function ReportProgressLoadingView({
  phase,
  title,
  subtitle,
  helperText,
  inline = false,
  activityLog = [],
  progressPercent,
  statusText,
}: ReportProgressLoadingViewProps) {
  const clampedPhase = Math.max(0, Math.min(phase, steps.length - 1));
  const step = steps[clampedPhase];
  const resolvedProgress = typeof progressPercent === "number" ? Math.max(0, Math.min(progressPercent, 100)) : step.progress;
  const resolvedStatusText = statusText?.trim() || step.text;

  return (
    <div className={`${styles.wrap} ${inline ? styles.wrapInline : ""}`}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Investigation Tool</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {helperText ? <p className={styles.helperText}>{helperText}</p> : null}

        <div className={styles.iconShell} aria-hidden="true">
          <div className={styles.iconFold} />
          <div className={styles.fill} style={{ height: `${resolvedProgress}%` }} />
          <div className={styles.iconGlyph}>R</div>
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span>Progress</span>
            <span>{resolvedProgress}%</span>
          </div>
          <div className={styles.track}>
            <div className={styles.bar} style={{ width: `${resolvedProgress}%` }} />
          </div>
          <p className={styles.quip}>{resolvedStatusText}</p>
        </div>

        {activityLog.length > 0 ? (
          <div className={styles.activityWrap}>
            <p className={styles.activityTitle}>Live Activity</p>
            <div className={styles.activityList} aria-live="polite">
              {activityLog.map((entry, index) => (
                <p key={`${entry}-${index}`} className={styles.activityEntry}>
                  {entry}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
