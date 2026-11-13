import { defaultEmailFrom, nonBlankEmailValue } from "@/lib/email-env";

export const GROWTH_SENDER_NAME_ENV = "GROWTH_SENDER_NAME";
export const GROWTH_SENDER_REPLY_TO_ENV = "GROWTH_SENDER_REPLY_TO";
export const GROWTH_BOOKING_URL_ENV = "GROWTH_BOOKING_URL";

const DISPLAY_NAME_RE = /^[\p{L}\p{M}' .-]{1,60}$/u;

export interface GrowthSender {
  /** Signature name; null uses the product brand. */
  name: string | null;
  /** Full RFC 5322 From value. The address stays the verified default. */
  from: string;
  replyTo?: string;
  bookingUrl: string | null;
}

function fromAddress(from: string): string {
  return from.match(/<([^>]+)>/)?.[1]?.trim() ?? from.trim();
}

function httpsUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Growth email identity; configured reply-to is optional until a real inbox is set. */
export function growthSender(fallbackReplyTo?: string): GrowthSender {
  const rawName = process.env[GROWTH_SENDER_NAME_ENV]?.trim();
  const name = rawName && DISPLAY_NAME_RE.test(rawName) ? rawName : null;
  const address = fromAddress(defaultEmailFrom());
  return {
    name,
    from: name
      ? `${name} at PETORA INDONESIA <${address}>`
      : `PETORA INDONESIA <${address}>`,
    replyTo:
      nonBlankEmailValue(process.env[GROWTH_SENDER_REPLY_TO_ENV]) ??
      fallbackReplyTo,
    bookingUrl: httpsUrl(process.env[GROWTH_BOOKING_URL_ENV]),
  };
}
