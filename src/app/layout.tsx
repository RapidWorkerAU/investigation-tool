import type { Metadata, Viewport } from "next";
import HashRedirector from "./HashRedirector";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investigation Tool",
  description: "Incident investigation canvas platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" data-scroll-behavior="smooth">
      <body>
        <HashRedirector />
        <main className="app-main-shell">{children}</main>
      </body>
    </html>
  );
}
