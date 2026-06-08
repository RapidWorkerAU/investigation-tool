"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import styles from "@/components/dashboard/DashboardShell.module.css";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import { type BillingAccessState, fetchAccessState } from "@/lib/access";
import { getAccessTimeZoneLabel } from "@/lib/accessTime";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type AccountSectionId = "user-info" | "my-access" | "delete-account";

const accountTabs: Array<{ id: AccountSectionId; label: string; description: string; icon: string }> = [
  { id: "user-info", label: "My Profile", description: "Name, email and password", icon: "/icons/account.svg" },
  { id: "my-access", label: "Access", description: "Plan, billing and renewal", icon: "/icons/time.svg" },
  { id: "delete-account", label: "Delete Account", description: "Permanent account removal", icon: "/icons/delete.svg" },
];

const formatDateTime = (value: string | null) =>
  value === "infinity"
    ? "Ongoing"
    : value
    ? new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Perth",
      }).format(new Date(value))
    : "Not available";
const accessTimeZoneLabel = getAccessTimeZoneLabel();

function renderAccessDateTimeTable(value: string | null) {
  const formatted = formatDateTime(value);
  const hasTimestamp = value && formatted !== "Not available";

  return (
    <span>
      {formatted}
      {hasTimestamp ? <><br />{`(${accessTimeZoneLabel})`}</> : null}
    </span>
  );
}

function renderAccessDateTimeMobile(value: string | null) {
  const formatted = formatDateTime(value);
  const hasTimestamp = value && formatted !== "Not available";

  return (
    <span className={styles.reportScopeReadValue}>
      {formatted}
      {hasTimestamp ? <><br />{`(${accessTimeZoneLabel})`}</> : null}
    </span>
  );
}

const formatAccessType = (value: BillingAccessState["currentAccessType"]) => {
  switch (value) {
    case "trial_7d":
      return "Free Account";
    case "pass_30d":
      return "30 Day Access";
    case "subscription_monthly":
      return "Ongoing Subscription";
    default:
      return "No access selected";
  }
};

const formatAccessStatus = (value: BillingAccessState["currentAccessStatus"] | null) => {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getAccessStatusTone = (value: BillingAccessState["currentAccessStatus"] | null) => {
  switch (value) {
    case "active":
      return styles.accessStatusPillGood;
    case "selection_required":
    case "checkout_required":
    case "pending_activation":
      return styles.accessStatusPillWarn;
    case "expired":
    case "payment_failed":
    case "cancelled":
    default:
      return styles.accessStatusPillBad;
  }
};

const getAccountInitials = (name: string, fallback: string) => {
  const source = name.trim() || fallback.trim();
  if (!source) return "IT";

  const parts = source.includes("@")
    ? source.split("@")[0].split(/[._-]+/)
    : source.split(/\s+/);

  return parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "IT";
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [activeSection, setActiveSection] = useState<AccountSectionId>("user-info");
  const [userInfoEditing, setUserInfoEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userInfoMessage, setUserInfoMessage] = useState("");
  const [userInfoMessageType, setUserInfoMessageType] = useState<"error" | "success" | "">("");
  const [userInfoErrorField, setUserInfoErrorField] = useState<"password" | "email" | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [initialUserInfo, setInitialUserInfo] = useState({
    fullName: "",
    username: "",
    email: "",
  });
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deleteProgressText, setDeleteProgressText] = useState("");
  const [accessState, setAccessState] = useState<BillingAccessState | null>(null);
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false);
  const passwordProvided = password.trim().length > 0 || confirmPassword.trim().length > 0;
  const passwordsMatch = password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;
  const confirmPasswordNeedsValue = password.length > 0 && confirmPassword.length === 0;
  const emailsMatch = email.trim() === confirmEmail.trim();
  const passwordHasError =
    (submitAttempted && passwordProvided && (!passwordsMatch || passwordTooShort)) || userInfoErrorField === "password";
  const confirmPasswordHasError =
    (submitAttempted && passwordProvided && (!passwordsMatch || confirmPasswordNeedsValue)) || userInfoErrorField === "password";
  const emailHasError = (submitAttempted && !emailsMatch) || userInfoErrorField === "email";

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

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

      const resolvedFullName = profile?.full_name || authFullName;
      const resolvedEmail = profile?.email || user.email || "";
      setInitialUserInfo({
        fullName: resolvedFullName,
        username: authUsername,
        email: resolvedEmail,
      });

      if (session?.access_token) {
        try {
          const nextAccessState = await fetchAccessState(session.access_token);
          setAccessState(nextAccessState);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Unable to load access details.");
        }
      }

      setLoading(false);
    };

    void loadUser();
  }, [supabase]);

  if (loading) {
    return (
      <DashboardPageSkeleton
        activeNav="account"
        eyebrow="Account"
        title="Edit Profile"
        subtitle="Manage your profile, account data and subscription history."
        variant="detail"
      />
    );
  }

  const save = async () => {
    setSubmitAttempted(true);
    setUserInfoMessage("");
    setUserInfoMessageType("");
    setUserInfoErrorField(null);

    if (!emailsMatch) {
      setUserInfoErrorField("email");
      setUserInfoMessage("Email addresses do not match.");
      setUserInfoMessageType("error");
      return;
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setUserInfoErrorField("password");
        setUserInfoMessage("Passwords do not match.");
        setUserInfoMessageType("error");
        return;
      }
      if (password.length < 8) {
        setUserInfoErrorField("password");
        setUserInfoMessage("Password must be at least 8 characters.");
        setUserInfoMessageType("error");
        return;
      }
    }

    setSaving(true);
    setUserInfoMessage("");
    setUserInfoMessageType("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserInfoMessage("You are no longer signed in.");
        setUserInfoMessageType("error");
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
        if (authError.message.toLowerCase().includes("password")) {
          setUserInfoErrorField("password");
        } else if (authError.message.toLowerCase().includes("email")) {
          setUserInfoErrorField("email");
        }
        setUserInfoMessage(authError.message);
        setUserInfoMessageType("error");
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
        setUserInfoMessage(profileError.message);
        setUserInfoMessageType("error");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSubmitAttempted(false);
      setInitialUserInfo({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
      });
      setUserInfoEditing(false);
      setUserInfoMessage(updatePayload.email ? "Account updated. Check your email to confirm the email change." : "Account updated.");
      setUserInfoMessageType("success");
    } finally {
      setSaving(false);
    }
  };

  const cancelUserInfoEdit = () => {
    setFullName(initialUserInfo.fullName);
    setUsername(initialUserInfo.username);
    setEmail(initialUserInfo.email);
    setConfirmEmail(initialUserInfo.email);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSubmitAttempted(false);
    setUserInfoErrorField(null);
    setUserInfoMessage("");
    setUserInfoMessageType("");
    setUserInfoEditing(false);
  };

  const openBillingPortal = async () => {
    try {
      setOpeningBillingPortal(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessage("You are no longer signed in.");
        return;
      }

      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to open billing portal.");
      }

      window.location.href = data.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open billing portal.");
    } finally {
      setOpeningBillingPortal(false);
    }
  };

  const canOpenBillingPortal = Boolean(accessState);

  const canPurchasePass30 =
    accessState?.currentAccessType === "pass_30d" &&
    accessState.currentAccessStatus !== "active";

  const canChooseAccessType = accessState?.currentAccessType === "trial_7d";

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

  const activeAccountTab = accountTabs.find((tab) => tab.id === activeSection) ?? accountTabs[0];
  const profileInitials = getAccountInitials(fullName, email);

  const startUserInfoEdit = () => {
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSubmitAttempted(false);
    setUserInfoErrorField(null);
    setUserInfoMessage("");
    setUserInfoMessageType("");
    setUserInfoEditing(true);
  };

  const renderProfileSection = () => (
    <div className={styles.accountSettingsPanel}>
      <div className={styles.accountProfileHero}>
        <div className={styles.accountProfileAvatar} aria-hidden="true">
          {profileInitials}
        </div>
        <div className={styles.accountProfileIdentity}>
          <strong>{fullName || username || "Investigation Tool user"}</strong>
          <span>{email || "No email saved"}</span>
        </div>
        {!userInfoEditing ? (
          <button type="button" className={styles.accountEditButton} onClick={startUserInfoEdit} disabled={loading}>
            <Image src="/icons/edit.svg" alt="" width={15} height={15} />
            <span>Edit</span>
          </button>
        ) : null}
      </div>

      <div className={styles.accountSettingsDetailCard}>
        <div className={styles.accountSettingsCardHeader}>
          <div>
            <h3>Personal Information</h3>
            <p>Core account details used for sign-in and your workspace identity.</p>
          </div>
          {!userInfoEditing ? (
            <button type="button" className={styles.accountEditButton} onClick={startUserInfoEdit} disabled={loading}>
              <Image src="/icons/edit.svg" alt="" width={15} height={15} />
              <span>Edit</span>
            </button>
          ) : null}
        </div>
        {!userInfoEditing ? (
          <div className={styles.accountInfoGrid}>
            <div className={styles.accountInfoItem}>
              <span>Full Name</span>
              <strong>{fullName || "-"}</strong>
            </div>
            <div className={styles.accountInfoItem}>
              <span>Username</span>
              <strong>{username || "-"}</strong>
            </div>
            <div className={styles.accountInfoItem}>
              <span>Email Address</span>
              <strong>{email || "-"}</strong>
            </div>
            <div className={styles.accountInfoItem}>
              <span>Password</span>
              <strong>••••••••</strong>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.accountFormGrid}>
              <label className={styles.accountField}>
                <span>Full Name</span>
                <input className={styles.input} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
              </label>
              <label className={styles.accountField}>
                <span>Username</span>
                <input className={styles.input} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
              </label>
              <label className={styles.accountField}>
                <span>Set New Password</span>
                <div className={styles.passwordField}>
                  <input
                    className={`${styles.input} ${styles.passwordInput} ${passwordHasError ? styles.inputError : ""}`}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Optional"
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
                <span className={`${styles.fieldStatusRight} ${styles.fieldStatusSpacer}`} aria-hidden="true">
                  .
                </span>
              </label>
              <label className={styles.accountField}>
                <span>Confirm Password</span>
                <div className={styles.passwordField}>
                  <input
                    className={`${styles.input} ${styles.passwordInput} ${confirmPasswordHasError ? styles.inputError : ""}`}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder={password.trim().length > 0 ? "Confirm new password" : ""}
                    disabled={password.trim().length === 0}
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
                <span
                  className={`${styles.fieldStatusRight} ${
                    passwordProvided
                      ? passwordsMatch && !passwordTooShort
                        ? styles.fieldHelpSuccess
                        : styles.fieldHelpError
                      : styles.fieldStatusSpacer
                  }`}
                  aria-hidden={passwordProvided ? undefined : "true"}
                >
                  {passwordProvided ? (passwordsMatch && !passwordTooShort ? "Passwords Match." : "Passwords Do Not Match") : "."}
                </span>
              </label>
              <label className={styles.accountField}>
                <span>Email Address</span>
                <input
                  className={`${styles.input} ${emailHasError ? styles.inputError : ""}`}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className={styles.accountField}>
                <span>Confirm Email Address</span>
                <input
                  className={`${styles.input} ${emailHasError ? styles.inputError : ""}`}
                  type="email"
                  value={confirmEmail}
                  onChange={(event) => setConfirmEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>
            </div>

            <div className={styles.accountSettingsActions}>
              <span
                className={`${styles.inlineFormMessage} ${
                  userInfoMessageType === "error"
                    ? styles.messageError
                    : userInfoMessageType === "success"
                      ? styles.messageSuccess
                      : ""
                }`}
              >
                {userInfoMessage}
              </span>
              <div className={styles.accountSettingsActionButtons}>
                <button type="button" className={styles.button} onClick={cancelUserInfoEdit} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className={`${styles.button} ${styles.accountPrimaryButton}`} onClick={() => void save()} disabled={saving || loading}>
                  {loading ? "Loading..." : saving ? "Saving..." : "Update Info"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderAccessSection = () => (
    <div className={styles.accountSettingsPanel}>
      <div className={styles.accountAccessHeroCard}>
        <div>
          <span className={styles.accountSettingsEyebrow}>Current Access</span>
          <h3>{formatAccessType(accessState?.currentAccessType ?? null)}</h3>
        </div>
        <span className={`${styles.accessStatusPill} ${getAccessStatusTone(accessState?.currentAccessStatus ?? null)}`}>
          {formatAccessStatus(accessState?.currentAccessStatus ?? null)}
        </span>
      </div>

      <div className={styles.accountSettingsDetailCard}>
        <div className={styles.accountSettingsCardHeader}>
          <div>
            <h3>Access Details</h3>
            <p>Plan dates are shown in {accessTimeZoneLabel}.</p>
          </div>
        </div>

        <div className={styles.accountInfoGrid}>
          <div className={styles.accountInfoItem}>
            <span>Access Type</span>
            <strong>{formatAccessType(accessState?.currentAccessType ?? null)}</strong>
          </div>
          <div className={styles.accountInfoItem}>
            <span>Status</span>
            <strong
              className={`${styles.accessStatusPill} ${styles.accountStatusPillValue} ${getAccessStatusTone(accessState?.currentAccessStatus ?? null)}`}
            >
              {formatAccessStatus(accessState?.currentAccessStatus ?? null)}
            </strong>
          </div>
          <div className={styles.accountInfoItem}>
            <span>Started</span>
            <strong>{renderAccessDateTimeTable(accessState?.currentPeriodStartsAt ?? null)}</strong>
          </div>
          <div className={styles.accountInfoItem}>
            <span>Expires</span>
            <strong>{renderAccessDateTimeTable(accessState?.currentPeriodEndsAt ?? null)}</strong>
          </div>
        </div>

        <div className={styles.accountSettingsActions}>
          <span />
          <div className={styles.accountSettingsActionButtons}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary} ${styles.accessActionButton}`}
              onClick={() => void openBillingPortal()}
              disabled={!canOpenBillingPortal || openingBillingPortal}
            >
              {openingBillingPortal && canOpenBillingPortal ? "Opening..." : "Open Billing Portal"}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary} ${styles.accessActionButton}`}
              onClick={() => router.push("/subscribe")}
              disabled={!canPurchasePass30}
            >
              Renew Access
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary} ${styles.accessActionButton}`}
              onClick={() => router.push("/subscribe")}
              disabled={!canChooseAccessType}
            >
              Upgrade Access
            </button>
          </div>
        </div>
      </div>

      {accessState?.readOnlyReason ? (
        <div className={styles.accountDangerBox}>
          <strong>Access restriction</strong>
          <p>{accessState.readOnlyReason}</p>
        </div>
      ) : null}
    </div>
  );

  const renderDeleteSection = () => (
    <div className={`${styles.accountSettingsPanel} ${styles.accountDeleteSection}`}>
      <div className={styles.accountSettingsDetailCard}>
        <div className={styles.accountDeleteSummary}>
          <strong>Delete your account</strong>
          <p className={styles.accountDeleteLead}>
            Deleting your account permanently removes your Investigation Tool access and starts a full cleanup of the data tied to
            that account. This is intended for cases where you no longer want the account, its maps, or the content created inside
            the workspace to remain in the system.
          </p>
          <p className={styles.accountDeleteLead}>
            Once the delete process starts, it cannot be cancelled or recovered. If you may need your account, investigation maps,
            or related content again, do not continue.
          </p>
          <strong>Summary</strong>
          <ul className={styles.accountDeleteList}>
            <li>Your login access will be removed</li>
            <li>Investigation maps you created will be deleted</li>
            <li>Content and records you created inside those maps will be removed</li>
            <li>This action is permanent and cannot be reversed</li>
          </ul>
        </div>
        <div className={styles.accountDeleteActions}>
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
            className={`${styles.buttonDanger} ${styles.accountDeleteButton}`}
            disabled={!deleteAcknowledged || deleteStatus === "running"}
            onClick={() => void handleDeleteAccount()}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderAccountSection = (sectionId: AccountSectionId) => {
    switch (sectionId) {
      case "user-info":
        return renderProfileSection();
      case "my-access":
        return renderAccessSection();
      case "delete-account":
        return renderDeleteSection();
      default:
        return null;
    }
  };

  return (
    <DashboardShell
      activeNav="account"
      eyebrow="Account"
      title="Account Settings"
      subtitle="Manage your profile, access and account data."
    >
      <section className={styles.accountCard}>
        {message && activeSection !== "user-info" ? (
          <p className={`${styles.message} ${message.toLowerCase().includes("unable") || message.toLowerCase().includes("do not") ? styles.messageError : ""}`}>
            {message}
          </p>
        ) : null}

        <div className={styles.accountSettingsSurface}>
          <aside className={styles.accountSettingsSidebar} aria-label="Account settings menu">
            <div className={styles.accountSettingsSidebarHeader}>
              <span>Settings</span>
              <strong>Account</strong>
            </div>
            <div className={styles.accountSettingsNav} role="tablist" aria-label="Account sections">
              {accountTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSection === tab.id}
                  className={`${styles.accountSettingsNavItem} ${activeSection === tab.id ? styles.accountSettingsNavItemActive : ""}`}
                  onClick={() => setActiveSection(tab.id)}
                >
                  <span className={styles.accountSettingsNavIcon} aria-hidden="true">
                    <Image src={tab.icon} alt="" width={18} height={18} />
                  </span>
                  <span className={styles.accountSettingsNavCopy}>
                    <strong>{tab.label}</strong>
                    <small>{tab.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.accountSettingsMobileAccordion} aria-label="Account settings sections">
            {accountTabs.map((tab) => {
              const isOpen = activeSection === tab.id;
              const panelId = `account-mobile-panel-${tab.id}`;

              return (
                <div
                  key={tab.id}
                  className={`${styles.accountSettingsAccordionItem} ${isOpen ? styles.accountSettingsAccordionItemOpen : ""}`}
                >
                  <button
                    type="button"
                    className={styles.accountSettingsAccordionButton}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setActiveSection(tab.id)}
                  >
                    <span className={styles.accountSettingsNavIcon} aria-hidden="true">
                      <Image src={tab.icon} alt="" width={18} height={18} />
                    </span>
                    <span className={styles.accountSettingsNavCopy}>
                      <strong>{tab.label}</strong>
                      <small>{tab.description}</small>
                    </span>
                    <span className={styles.accountSettingsAccordionChevron} aria-hidden="true" />
                  </button>
                  {isOpen ? (
                    <div id={panelId} className={styles.accountSettingsMobilePanel}>
                      {renderAccountSection(tab.id)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className={styles.accountSettingsContent}>
            <div className={styles.accountSettingsContentHeader}>
              <div>
                <h2>{activeAccountTab.label}</h2>
                <p>{activeAccountTab.description}</p>
              </div>
            </div>

          {activeSection === "user-info" ? (
            <div className={styles.accountSettingsPanel}>
              <div className={styles.accountProfileHero}>
                <div className={styles.accountProfileAvatar} aria-hidden="true">
                  {profileInitials}
                </div>
                <div className={styles.accountProfileIdentity}>
                  <strong>{fullName || username || "Investigation Tool user"}</strong>
                  <span>{email || "No email saved"}</span>
                </div>
                {!userInfoEditing ? (
                  <button
                    type="button"
                    className={styles.accountEditButton}
                    onClick={() => {
                      setPassword("");
                      setConfirmPassword("");
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                      setSubmitAttempted(false);
                      setUserInfoErrorField(null);
                      setUserInfoMessage("");
                      setUserInfoMessageType("");
                      setUserInfoEditing(true);
                    }}
                    disabled={loading}
                  >
                    <Image src="/icons/edit.svg" alt="" width={15} height={15} />
                    <span>Edit</span>
                  </button>
                ) : null}
              </div>

              <div className={styles.accountSettingsDetailCard}>
                <div className={styles.accountSettingsCardHeader}>
                  <div>
                    <h3>Personal Information</h3>
                    <p>Core account details used for sign-in and your workspace identity.</p>
                  </div>
                  {!userInfoEditing ? (
                    <button
                      type="button"
                      className={styles.accountEditButton}
                      onClick={() => {
                        setPassword("");
                        setConfirmPassword("");
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                        setSubmitAttempted(false);
                        setUserInfoErrorField(null);
                        setUserInfoMessage("");
                        setUserInfoMessageType("");
                        setUserInfoEditing(true);
                      }}
                      disabled={loading}
                    >
                      <Image src="/icons/edit.svg" alt="" width={15} height={15} />
                      <span>Edit</span>
                    </button>
                  ) : null}
                </div>
                {!userInfoEditing ? (
                  <>
                    <div className={styles.accountInfoGrid}>
                      <div className={styles.accountInfoItem}>
                        <span>Full Name</span>
                        <strong>{fullName || "-"}</strong>
                      </div>
                      <div className={styles.accountInfoItem}>
                        <span>Username</span>
                        <strong>{username || "-"}</strong>
                      </div>
                      <div className={styles.accountInfoItem}>
                        <span>Email Address</span>
                        <strong>{email || "-"}</strong>
                      </div>
                      <div className={styles.accountInfoItem}>
                        <span>Password</span>
                        <strong>••••••••</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.accountFormGrid}>
                      <label className={styles.accountField}>
                        <span>Full Name</span>
                        <input className={styles.input} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
                      </label>
                      <label className={styles.accountField}>
                        <span>Username</span>
                        <input className={styles.input} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
                      </label>
                      <label className={styles.accountField}>
                        <span>Set New Password</span>
                        <div className={styles.passwordField}>
                          <input
                            className={`${styles.input} ${styles.passwordInput} ${passwordHasError ? styles.inputError : ""}`}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            placeholder="Optional"
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
                        <span className={`${styles.fieldStatusRight} ${styles.fieldStatusSpacer}`} aria-hidden="true">
                          .
                        </span>
                      </label>
                      <label className={styles.accountField}>
                        <span>Confirm Password</span>
                        <div className={styles.passwordField}>
                          <input
                            className={`${styles.input} ${styles.passwordInput} ${confirmPasswordHasError ? styles.inputError : ""}`}
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            autoComplete="new-password"
                            placeholder={password.trim().length > 0 ? "Confirm new password" : ""}
                            disabled={password.trim().length === 0}
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
                        <span
                          className={`${styles.fieldStatusRight} ${
                            passwordProvided
                              ? passwordsMatch && !passwordTooShort
                                ? styles.fieldHelpSuccess
                                : styles.fieldHelpError
                              : styles.fieldStatusSpacer
                          }`}
                          aria-hidden={passwordProvided ? undefined : "true"}
                        >
                          {passwordProvided ? (passwordsMatch && !passwordTooShort ? "Passwords Match." : "Passwords Do Not Match") : "."}
                        </span>
                      </label>
                      <label className={styles.accountField}>
                        <span>Email Address</span>
                        <input
                          className={`${styles.input} ${emailHasError ? styles.inputError : ""}`}
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          autoComplete="email"
                        />
                      </label>
                      <label className={styles.accountField}>
                        <span>Confirm Email Address</span>
                        <input
                          className={`${styles.input} ${emailHasError ? styles.inputError : ""}`}
                          type="email"
                          value={confirmEmail}
                          onChange={(event) => setConfirmEmail(event.target.value)}
                          autoComplete="email"
                        />
                      </label>
                    </div>

                    <div className={styles.accountSettingsActions}>
                      <span
                        className={`${styles.inlineFormMessage} ${
                          userInfoMessageType === "error"
                            ? styles.messageError
                            : userInfoMessageType === "success"
                              ? styles.messageSuccess
                              : ""
                        }`}
                      >
                        {userInfoMessage}
                      </span>
                      <div className={styles.accountSettingsActionButtons}>
                        <button type="button" className={styles.button} onClick={cancelUserInfoEdit} disabled={saving}>
                          Cancel
                        </button>
                        <button type="button" className={`${styles.button} ${styles.accountPrimaryButton}`} onClick={() => void save()} disabled={saving || loading}>
                          {loading ? "Loading..." : saving ? "Saving..." : "Update Info"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {activeSection === "my-access" ? (
            <div className={styles.accountSettingsPanel}>
              <div className={styles.accountAccessHeroCard}>
                <div>
                  <span className={styles.accountSettingsEyebrow}>Current Access</span>
                  <h3>{formatAccessType(accessState?.currentAccessType ?? null)}</h3>
                </div>
                <span
                  className={`${styles.accessStatusPill} ${getAccessStatusTone(accessState?.currentAccessStatus ?? null)}`}
                >
                  {formatAccessStatus(accessState?.currentAccessStatus ?? null)}
                </span>
              </div>

              <div className={styles.accountSettingsDetailCard}>
                <div className={styles.accountSettingsCardHeader}>
                  <div>
                    <h3>Access Details</h3>
                    <p>Plan dates are shown in {accessTimeZoneLabel}.</p>
                  </div>
                </div>

                <div className={styles.accountInfoGrid}>
                  <div className={styles.accountInfoItem}>
                    <span>Access Type</span>
                    <strong>{formatAccessType(accessState?.currentAccessType ?? null)}</strong>
                  </div>
                  <div className={styles.accountInfoItem}>
                    <span>Status</span>
                    <strong
                      className={`${styles.accessStatusPill} ${styles.accountStatusPillValue} ${getAccessStatusTone(accessState?.currentAccessStatus ?? null)}`}
                    >
                      {formatAccessStatus(accessState?.currentAccessStatus ?? null)}
                    </strong>
                  </div>
                  <div className={styles.accountInfoItem}>
                    <span>Started</span>
                    <strong>{renderAccessDateTimeTable(accessState?.currentPeriodStartsAt ?? null)}</strong>
                  </div>
                  <div className={styles.accountInfoItem}>
                    <span>Expires</span>
                    <strong>{renderAccessDateTimeTable(accessState?.currentPeriodEndsAt ?? null)}</strong>
                  </div>
                </div>

                <div className={styles.accountSettingsActions}>
                  <span />
                  <div className={styles.accountSettingsActionButtons}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary} ${styles.accessActionButton}`}
                      onClick={() => void openBillingPortal()}
                      disabled={!canOpenBillingPortal || openingBillingPortal}
                    >
                      {openingBillingPortal && canOpenBillingPortal ? "Opening..." : "Open Billing Portal"}
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary} ${styles.accessActionButton}`}
                      onClick={() => router.push("/subscribe")}
                      disabled={!canPurchasePass30}
                    >
                      Renew Access
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary} ${styles.accessActionButton}`}
                      onClick={() => router.push("/subscribe")}
                      disabled={!canChooseAccessType}
                    >
                      Upgrade Access
                    </button>
                  </div>
                </div>
              </div>

                {accessState?.readOnlyReason ? (
                  <div className={styles.accountDangerBox}>
                    <strong>Access restriction</strong>
                    <p>{accessState.readOnlyReason}</p>
                  </div>
                ) : null}
            </div>
          ) : null}

          {activeSection === "delete-account" ? (
            <div className={`${styles.accountSettingsPanel} ${styles.accountDeleteSection}`}>
              <div className={styles.accountSettingsDetailCard}>
                <div className={styles.accountDeleteSummary}>
                  <strong>Delete your account</strong>
                  <p className={styles.accountDeleteLead}>
                    Deleting your account permanently removes your Investigation Tool access and starts a full cleanup of the data
                    tied to that account. This is intended for cases where you no longer want the account, its maps, or the content
                    created inside the workspace to remain in the system.
                  </p>
                  <p className={styles.accountDeleteLead}>
                    Once the delete process starts, it cannot be cancelled or recovered. If you may need your account, investigation
                    maps, or related content again, do not continue.
                  </p>
                  <strong>Summary</strong>
                  <ul className={styles.accountDeleteList}>
                    <li>Your login access will be removed</li>
                    <li>Investigation maps you created will be deleted</li>
                    <li>Content and records you created inside those maps will be removed</li>
                    <li>This action is permanent and cannot be reversed</li>
                  </ul>
                </div>
                <div className={styles.accountDeleteActions}>
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
                    className={`${styles.buttonDanger} ${styles.accountDeleteButton}`}
                    disabled={!deleteAcknowledged || deleteStatus === "running"}
                    onClick={() => void handleDeleteAccount()}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </div>
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


