import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PETORA application branding", () => {
  const pdfSource = readFileSync("lib/pdf.ts", "utf8");

  it("uses PETORA INDONESIA for staff-facing app identity", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const sidebar = readFileSync("components/layout/sidebar.tsx", "utf8");
    const topBar = readFileSync("components/layout/top-bar.tsx", "utf8");
    const dashboard = readFileSync("app/(dashboard)/layout.tsx", "utf8");
    const login = readFileSync("app/(auth)/login/page.tsx", "utf8");
    const welcome = readFileSync("components/welcome/welcome-copy.ts", "utf8");

    expect(layout).toContain("PETORA INDONESIA | Sistem Operasional Hewan");
    expect(sidebar).toContain("PETORA INDONESIA");
    expect(topBar).toContain('?? "PETORA INDONESIA"');
    expect(dashboard).toContain("Powered by PETORA INDONESIA");
    expect(login).toContain("PETORA INDONESIA");
    expect(welcome).toContain("Welcome to PETORA INDONESIA");
  });

  it("keeps the fixed attribution on customer-facing branded pages", () => {
    for (const path of [
      "app/portal/layout.tsx",
      "components/portal/portal-shell.tsx",
      "app/sign/layout.tsx",
      "app/capture/layout.tsx",
      "app/book/layout.tsx",
    ]) {
      expect(readFileSync(path, "utf8")).toContain("PETORA INDONESIA");
    }
  });

  it("uses PETORA labels in the supplied logo assets", () => {
    expect(readFileSync("public/logo.svg", "utf8")).toContain(
      'aria-label="PETORA INDONESIA"',
    );
    expect(readFileSync("public/logo.svg", "utf8")).toContain(
      "PETORA INDONESIA",
    );
    expect(readFileSync("public/favicon.svg", "utf8")).toContain(
      'aria-label="PETORA INDONESIA"',
    );
  });

  it("adds the fixed attribution to every generated PDF type", () => {
    const pdfFunctions = [
      ["generateInvoicePdf", "drawPoweredByFooter"],
      ["generatePrescriptionLabelPdf", "drawPoweredByFooter"],
      ["generateMedicalSummaryPdf", "drawPoweredByFooter"],
      ["generateVaccinationCertificatePdf", "drawPoweredByFooter"],
      ["generateVaccinationHistoryCertificatePdf", "drawCertificateFooter"],
      ["generateRabiesVaccinationCertificatePdf", "drawCertificateFooter"],
      ["generateReportPdf", "drawPoweredByFooter"],
      ["generateDischargeInstructions", "drawPoweredByFooter"],
    ] as const;

    for (const [functionName, footer] of pdfFunctions) {
      const start = pdfSource.indexOf(`export function ${functionName}`);
      const nextFunction = pdfSource.indexOf("\nexport function ", start + 1);
      expect(start, functionName).toBeGreaterThanOrEqual(0);
      expect(
        pdfSource.slice(start, nextFunction < 0 ? undefined : nextFunction),
        functionName,
      ).toContain(footer);
    }
  });
});
