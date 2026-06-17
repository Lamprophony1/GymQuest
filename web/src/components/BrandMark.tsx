interface BrandMarkProps {
  className?: string;
}

export function BarbellMark({ className = 'brand-mark__barbell' }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 9v6" />
      <path d="M8 7v10" />
      <path d="M16 7v10" />
      <path d="M19 9v6" />
      <path d="M8 12h8" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
    </svg>
  );
}
