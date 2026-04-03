import DashboardShell from "@/components/dashboard/DashboardShell";
import styles from "@/components/dashboard/DashboardShell.module.css";

export default function DeleteAccountPage() {
  return (
    <DashboardShell
      activeNav="account"
      eyebrow="Account"
      title="Delete Account"
      subtitle="This page uses the dashboard shell, but the destructive action stays isolated."
    >
      <section className={`${styles.contentCard} ${styles.contentCardCompact}`}>
        <div className={styles.fieldStack}>
          <p className={styles.message}>This flow is scaffolded. Wire to your Supabase delete-user endpoint next.</p>
          <div className={styles.actions}>
            <button className={styles.buttonDanger}>Confirm Delete Account</button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
