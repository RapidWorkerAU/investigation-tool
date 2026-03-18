import type { Metadata, Viewport } from "next";
import HashRedirector from "./HashRedirector";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investigation Tool",
  description: "Incident investigation canvas platform",
  applicationName: "Investigation Tool",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Investigation Tool",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ecebe7",
  colorScheme: "light",
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
