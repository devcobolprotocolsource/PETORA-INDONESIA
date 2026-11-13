import Link from "next/link";

/** The PETORA INDONESIA paw, shared with the main app. */
export function PawMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="4.5" ry="3.5" />
      <ellipse cx="6" cy="9" rx="2" ry="2.5" />
      <ellipse cx="9.5" cy="4.5" rx="1.7" ry="2.2" />
      <ellipse cx="14.5" cy="4.5" rx="1.7" ry="2.2" />
      <ellipse cx="18" cy="9" rx="2" ry="2.5" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="PETORA INDONESIA Help home">
      <span className="brand-badge">
        <PawMark className="h-5 w-5 text-white" />
      </span>
      <span className="brand-word">PETORA INDONESIA</span>
      <span className="brand-sub">Help</span>
    </Link>
  );
}
