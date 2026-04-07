import styles from "./ReportProgressLoadingView.module.css";

type ReportProgressLoadingViewProps = {
  phase: number;
  title: string;
  subtitle: string;
  inline?: boolean;
};

const steps = [
  { progress: 14, text: "Opening the report workspace." },
  { progress: 28, text: "Checking access and gathering investigation data." },
  { progress: 44, text: "Organising people, timeline, and findings." },
  { progress: 60, text: "Linking evidence files and preview sources." },
  { progress: 76, text: "Composing structured report sections." },
  { progress: 90, text: "Preparing PDF rendering and controls." },
  { progress: 100, text: "Final checks done. Ready to review." },
];

export function ReportProgressLoadingView({ phase, title, subtitle, inline = false }: ReportProgressLoadingViewProps) {
  const clampedPhase = Math.max(0, Math.min(phase, steps.length - 1));
  const step = steps[clampedPhase];

  return (
    <div className={`${styles.wrap} ${inline ? styles.wrapInline : ""}`}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Investigation Tool</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.iconShell} aria-hidden="true">
          <div className={styles.iconFold} />
          <div className={styles.fill} style={{ height: `${step.progress}%` }} />
          <div className={styles.iconGlyph}>R</div>
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span>Progress</span>
            <span>{step.progress}%</span>
          </div>
          <div className={styles.track}>
            <div className={styles.bar} style={{ width: `${step.progress}%` }} />
          </div>
          <p className={styles.quip}>{step.text}</p>
        </div>
      </div>
    </div>
  );
}
