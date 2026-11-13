import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/portal-shell";

export const metadata: Metadata = {
  title: "Portal Pelanggan | PETORA INDONESIA",
  description: "View your pet's health information",
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
