"use client";

type DashboardLogoutLinkProps = {
  className?: string;
};

export default function DashboardLogoutLink({ className }: DashboardLogoutLinkProps) {
  const handleLogout = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    localStorage.removeItem("investigation_tool_access_token");
    localStorage.removeItem("investigation_tool_refresh_token");
    localStorage.removeItem("investigation_tool_user_email");
    localStorage.removeItem("investigation_tool_user_id");
    window.location.assign("/login");
  };

  return (
    <a className={className} href="/login" onClick={handleLogout}>
      Log out
    </a>
  );
}
