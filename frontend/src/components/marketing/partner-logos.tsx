import type { SVGProps } from "react";

// Simple, recognizable icon marks for each partner, drawn to evoke their real
// logomark rather than a generic initials badge. Single color (fill=currentColor)
// so they can be recolored per brand from the parent.

export function BinanceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5 14.6 5.1 12 7.7 9.4 5.1 12 2.5Z" />
      <path d="M6.8 7.7 9.4 10.3 6.8 12.9 4.2 10.3 6.8 7.7Z" />
      <path d="M17.2 7.7 19.8 10.3 17.2 12.9 14.6 10.3 17.2 7.7Z" />
      <path d="M12 8.9 14.6 11.5 12 14.1 9.4 11.5 12 8.9Z" />
      <path d="M6.8 13.7 9.4 16.3 6.8 18.9 4.2 16.3 6.8 13.7Z" />
      <path d="M17.2 13.7 19.8 16.3 17.2 18.9 14.6 16.3 17.2 13.7Z" />
      <path d="M12 14.9 14.6 17.5 12 20.1 9.4 17.5 12 14.9Z" />
    </svg>
  );
}

export function CoinbaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="10.5" />
      <rect x="8.6" y="8.6" width="6.8" height="6.8" rx="2" fill="white" />
    </svg>
  );
}

export function CircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9.3" cy="12" r="6.6" />
      <circle cx="14.7" cy="12" r="6.6" />
    </svg>
  );
}

export function CoinGeckoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="10.5" />
      <circle cx="8.7" cy="9.8" r="1.5" fill="white" />
      <circle cx="8.7" cy="9.8" r="0.6" fill="#1b1b1b" />
      <path d="M8 15.2c1.3 1 2.7 1 4 0" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function KrakenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...props}>
      <circle cx="12" cy="9" r="5" fill="currentColor" stroke="none" />
      <path d="M8 13.5c-1.2 2-1.8 4-1.5 6.5" />
      <path d="M10.3 14.3c-.6 2.2-.6 4.3.2 6.7" />
      <path d="M13.7 14.3c.6 2.2.6 4.3-.2 6.7" />
      <path d="M16 13.5c1.2 2 1.8 4 1.5 6.5" />
      <circle cx="9.8" cy="8.3" r="0.9" fill="white" stroke="none" />
      <circle cx="14.2" cy="8.3" r="0.9" fill="white" stroke="none" />
    </svg>
  );
}

export function LedgerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 8.5V3h5.5" />
      <path d="M21 8.5V3h-5.5" />
      <path d="M3 15.5V21h5.5" />
      <path d="M9 3h6" strokeOpacity="0" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" />
      <path d="M15.5 21H21v-5.5" />
    </svg>
  );
}

export function ChainalysisIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="7" width="10" height="10" rx="5" />
      <rect x="11" y="7" width="10" height="10" rx="5" />
    </svg>
  );
}

export function WalletConnectIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6.5 9.8c3-3 7.9-3 10.9 0l.4.3c.2.1.2.4 0 .5l-1.3 1.3c-.1.1-.2.1-.3 0l-.5-.5c-2.1-2.1-5.5-2.1-7.6 0l-.5.6c-.1.1-.2.1-.3 0L6 10.6c-.2-.1-.2-.4 0-.5l.5-.3Z"
        fill="currentColor"
      />
      <path
        d="M4.4 12.1l1.2 1.2c.1.1.2.1.3 0l3.6-3.6c.1-.1.2-.1.3 0l3.6 3.6c.1.1.2.1.3 0l3.6-3.6c.1-.1.2-.1.3 0l1.2 1.2c.2.1.2.4 0 .5l-4.7 4.7c-.1.1-.2.1-.3 0l-3.6-3.6c-.1-.1-.2-.1-.3 0l-3.6 3.6c-.1.1-.2.1-.3 0l-1.6-1.6c-.2-.1-.2-.4 0-.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
