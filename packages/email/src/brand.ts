/**
 * Brand identity passed into every email shell. Branding and service addresses
 * can be configured through environment variables for each installation.
 */
export interface Brand {
  /** Display name in the header wordmark. */
  name: string;
  /** Legal/company name shown in the footer. */
  companyName: string;
  /** Reply-To + footer contact address. */
  supportEmail?: string;
  /** Physical mailing address (CAN-SPAM for promotional nudges). Optional. */
  companyAddress?: string;
  /** Base URL of the hosted app (CTAs). */
  appUrl: string;
  /** Marketing site URL. */
  marketingUrl: string;
  /** Full URL of the demo, including its route. */
  demoUrl: string;
  /**
   * Optional hosted logo image (PNG recommended — most email clients strip
   * SVG). When omitted, the shell renders a CSS wordmark that works everywhere.
   */
  logoUrl?: string;
}

function nonBlankEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function openvpmBrand(): Brand {
  const appUrl = nonBlankEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
  return {
    name: "PETORA INDONESIA",
    companyName: nonBlankEnv("EMAIL_COMPANY_NAME") ?? "PETORA INDONESIA",
    supportEmail: nonBlankEnv("EMAIL_SUPPORT_ADDRESS"),
    companyAddress: nonBlankEnv("EMAIL_COMPANY_ADDRESS"),
    appUrl,
    marketingUrl: nonBlankEnv("NEXT_PUBLIC_APP_URL") ?? appUrl,
    demoUrl:
      nonBlankEnv("NEXT_PUBLIC_DEMO_URL") ??
      new URL("/demo-start", appUrl).toString(),
    logoUrl: nonBlankEnv("EMAIL_LOGO_URL"),
  };
}
