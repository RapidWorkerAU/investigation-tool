"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import styles from "@/components/dashboard/DashboardShell.module.css";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type AccountTab = "user-info" | "your-data" | "past-purchases" | "delete-account";

const tabs: Array<{ id: AccountTab; label: string }> = [
  { id: "user-info", label: "User Info" },
  { id: "your-data", label: "Your Data" },
  { id: "past-purchases", label: "Past Purchases" },
  { id: "delete-account", label: "Delete Account" },
];

export default function AccountPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [activeTab, setActiveTab] = useState<AccountTab>("user-info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deleteProgressText, setDeleteProgressText] = useState("");
  const passwordProvided = password.length > 0 || confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;
  const confirmPasswordNeedsValue = password.length > 0 && confirmPassword.length === 0;
  const emailsMatch = email.trim() === confirmEmail.trim();
  const passwordHasError = submitAttempted && passwordProvided && (!passwordsMatch || passwordTooShort);
  const confirmPasswordHasError = submitAttempted && passwordProvided && (!passwordsMatch || confirmPasswordNeedsValue);
  const emailHasError = submitAttempted && !emailsMatch;

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage(userError?.message || "Unable to load account.");
        setLoading(false);
        return;
      }

      const authFullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
      const authUsername = typeof user.user_metadata?.username === "string" ? user.user_metadata.username : "";

      setFullName(authFullName);
      setUsername(authUsername);
      setEmail(user.email ?? "");
      setConfirmEmail(user.email ?? "");

      const { data: profile } = await supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.email) {
          setEmail(profile.email);
          setConfirmEmail(profile.email);
        }
      }

      setLoading(false);
    };

    void loadUser();
  }, [supabase]);

  const save = async () => {
    setSubmitAttempted(true);

    if (!emailsMatch) {
      setMessage("Email addresses do not match.");
      return;
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setMessage("Password must be at least 8 characters.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("You are no longer signed in.");
        return;
      }

      const updatePayload: {
        email?: string;
        password?: string;
        data: { full_name: string; username: string };
      } = {
        data: {
          full_name: fullName.trim(),
          username: username.trim(),
        },
      };

      if (email.trim() && email.trim() !== user.email) {
        updatePayload.email = email.trim();
      }

      if (password) {
        updatePayload.password = password;
      }

      const { error: authError } = await supabase.auth.updateUser(updatePayload);
      if (authError) {
        setMessage(authError.message);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName.trim(),
            email: email.trim(),
          },
          { onConflict: "id" }
        );

      if (profileError) {
        setMessage(profileError.message);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSubmitAttempted(false);
      setMessage(updatePayload.email ? "Account updated. Check your email to confirm the email change." : "Account updated.");
    } finally {
      setSaving(false);
    }
  };

  const downloadData = async () => {
    setDownloading(true);
    setMessage("");
    try {
      const res = await fetch("/api/account/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "investigation-tool-export.json";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Your account data export has downloaded.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteModalOpen(true);
    setDeleteStatus("running");
    setDeleteProgress(8);
    setDeleteProgressText("Preparing account deletion...");

    const interval = window.setInterval(() => {
      setDeleteProgress((current) => (current >= 88 ? current : current + 8));
    }, 280);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      setDeleteProgressText("Deleting your content from Investigation Tool...");
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete account.");
      }

      window.clearInterval(interval);
      setDeleteProgress(100);
      setDeleteStatus("success");
      setDeleteProgressText("Account deleted successfully.");

      await supabase.auth.signOut();
      localStorage.removeItem("investigation_tool_access_token");
      localStorage.removeItem("investigation_tool_refresh_token");
      localStorage.removeItem("investigation_tool_user_email");
      localStorage.removeItem("investigation_tool_user_id");

      window.setTimeout(() => {
        window.location.href = "/";
      }, 1600);
    } catch (error) {
      window.clearInterval(interval);
      setDeleteStatus("error");
      setDeleteProgress(100);
      setDeleteProgressText(error instanceof Error ? error.message : "Unable to delete account.");
    }
  };

  return (
    <DashboardShell
      activeNav="account"
      eyebrow="Account"
      title="Edit Profile"
      subtitle="Manage your profile, account data and subscription history."
    >
      <section className={styles.accountCard}>
        <div className={styles.accountTabs} role="tablist" aria-label="Account sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.accountTab} ${activeTab === tab.id ? styles.accountTabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message ? (
          <p className={`${styles.message} ${message.toLowerCase().includes("unable") || message.toLowerCase().includes("do not") ? styles.messageError : ""}`}>
            {message}
          </p>
        ) : null}

        {activeTab === "user-info" ? (
          <div className={styles.accountSection}>
            <div className={styles.accountFormGrid}>
              <label className={styles.accountField}>
                <span>Full Name</span>
                <input className={styles.input} value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
              <label className={styles.accountField}>
                <span>Username</span>
                <input className={styles.input} value={username} onChange={(event) => setUsername(event.target.value)} />
              </label>
              <label className={styles.accountField}>
                <span>Password</span>
                <div className={styles.passwordField}>
                <input
                  className={`${styles.input} ${styles.passwordInput} ${passwordHasError ? styles.inputError : ""}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    <Image
                      src={showPassword ? "/icons/visible.svg" : "/icons/hidden.svg"}
                      alt=""
                      width={18}
                      height={18}
                      className={styles.passwordToggleIcon}
                    />
                  </button>
                </div>
              </label>
              <label className={styles.accountField}>
                <span>Confirm Password</span>
                <div className={styles.passwordField}>
                  <input
                    className={`${styles.input} ${styles.passwordInput} ${confirmPasswordHasError ? styles.inputError : ""}`}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    <Image
                      src={showConfirmPassword ? "/icons/visible.svg" : "/icons/hidden.svg"}
                      alt=""
                      width={18}
                      height={18}
                      className={styles.passwordToggleIcon}
                    />
                  </button>
                </div>
                {passwordProvided ? (
                  <span
                    className={`${styles.fieldStatusRight} ${
                      passwordsMatch && !passwordTooShort ? styles.fieldHelpSuccess : styles.fieldHelpError
                    }`}
                  >
                    {passwordsMatch && !passwordTooShort ? "Passwords Match." : "Passwords Do Not Match"}
                  </span>
                ) : null}
              </label>
              <label className={styles.accountField}>
                <span>Email Address</span>
                <input
                  className={`${styles.input} ${emailHasError ? styles.inputError : ""}`}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className={styles.accountField}>
                <span>Confirm Email Address</span>
                <input
                  className={`${styles.input} ${emailHasError ? styles.inputError : ""}`}
                  type="email"
                  value={confirmEmail}
                  onChange={(event) => setConfirmEmail(event.target.value)}
                />
              </label>
            </div>

            <div className={styles.accountActions}>
              <button type="button" className={`${styles.button} ${styles.accountPrimaryButton}`} onClick={() => void save()} disabled={saving || loading}>
                {loading ? "Loading..." : saving ? "Saving..." : "Update Info"}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "your-data" ? (
          <div className={styles.accountSection}>
            <div className={styles.accountInfoBlock}>
              <h3>Your Data</h3>
              <p>Download a copy of the information associated with your Investigation Tool account.</p>
            </div>
            <div className={styles.accountActions}>
              <button type="button" className={`${styles.button} ${styles.accountPrimaryButton}`} onClick={() => void downloadData()} disabled={downloading}>
                {downloading ? "Preparing Export..." : "Download Your Data"}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "past-purchases" ? (
          <div className={styles.accountSection}>
            <div className={styles.accountInfoBlock}>
              <h3>Past Purchases</h3>
              <p>Your purchase history will appear here once billing history is connected to the account workspace.</p>
            </div>
            <div className={styles.accountEmptyBox}>No purchases recorded yet.</div>
          </div>
        ) : null}

        {activeTab === "delete-account" ? (
          <div className={styles.accountSection}>
            <div className={styles.accountInfoBlock}>
              <h3>Delete Account</h3>
              <p>Deleting your account permanently removes your Investigation Tool access and the content you created.</p>
            </div>
            <div className={styles.accountDeleteSummary}>
              <strong>What this means</strong>
              <ul className={styles.accountDeleteList}>
                <li>Your login access will be removed</li>
                <li>Investigation maps you created will be deleted</li>
                <li>Content you created inside maps will be removed</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
            <div className={styles.accountActions}>
              <label className={styles.accountCheckboxRow}>
                <input
                  type="checkbox"
                  checked={deleteAcknowledged}
                  onChange={(event) => setDeleteAcknowledged(event.target.checked)}
                />
                <span>I understand this action is permanent and cannot be undone.</span>
              </label>
              <button
                type="button"
                className={styles.buttonDanger}
                disabled={!deleteAcknowledged || deleteStatus === "running"}
                onClick={() => void handleDeleteAccount()}
              >
                Delete Account
              </button>
            </div>
          </div>
        ) : null}

        {deleteModalOpen ? (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalCard}>
              {deleteStatus === "running" ? (
                <>
                  <h3 className={styles.modalTitle}>Deleting Account</h3>
                  <p className={styles.modalText}>{deleteProgressText}</p>
                  <div className={styles.progressBlock}>
                    <div className={styles.progressHeader}>
                      <span>Removing account and content</span>
                      <span>{deleteProgress}%</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${deleteProgress}%` }} />
                    </div>
                  </div>
                </>
              ) : null}

              {deleteStatus === "success" ? (
                <>
                  <h3 className={styles.modalTitle}>Account Deleted</h3>
                  <p className={styles.modalText}>Your account and associated content have been removed. Redirecting now...</p>
                  <div className={styles.progressBlock}>
                    <div className={styles.progressTrack}>
                      <div className={`${styles.progressFill} ${styles.progressSuccess}`} style={{ width: "100%" }} />
                    </div>
                  </div>
                </>
              ) : null}

              {deleteStatus === "error" ? (
                <>
                  <h3 className={styles.modalTitle}>Delete Failed</h3>
                  <p className={`${styles.modalText} ${styles.messageError}`}>{deleteProgressText}</p>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={() => {
                        setDeleteModalOpen(false);
                        setDeleteStatus("idle");
                        setDeleteProgress(0);
                        setDeleteProgressText("");
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}
