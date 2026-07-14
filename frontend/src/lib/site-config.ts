export const siteConfig = {
  name: "BYT Trading",
  abn: "49674828034",
  abnUrl: "https://abr.business.gov.au/ABN/View?abn=49674828034",
  supportEmail: "support@byttrading.com",
  supportWhatsapp: "https://wa.me/000000000000",
  address: "Level 12, 123 Collins Street, Melbourne VIC 3000, Australia",
  buyCryptoUrl: "https://www.moonpay.com/buy",
};

export const socialLinks = [
  { label: "X", href: "https://x.com/byttrading" },
  { label: "Facebook", href: "https://facebook.com/byttrading" },
  { label: "Instagram", href: "https://instagram.com/byttrading" },
  { label: "LinkedIn", href: "https://linkedin.com/company/byttrading" },
  { label: "Telegram", href: "https://t.me/byttrading" },
];

export const mainNav = [
  { label: "Plans", href: "/plans" },
  { label: "Services", href: "/services" },
  { label: "Technology", href: "/technology" },
  { label: "About Us", href: "/about-us" },
];

export const footerNav = {
  company: [
    { label: "Home", href: "/" },
    { label: "Technology", href: "/technology" },
    { label: "Services", href: "/services" },
    { label: "About Us", href: "/about-us" },
    { label: "WhatsApp Support", href: siteConfig.supportWhatsapp },
  ],
  legal: [
    { label: "Terms of Use", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Risk Disclosure", href: "/legal/risk-disclosure" },
    { label: "Regulatory Status", href: "/legal/regulatory-status" },
    { label: "Company Registration", href: "/legal/company-registration" },
  ],
};

export interface BotDefinition {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  color: string;
  rateRange: string;
  rateNote?: string;
  pricing: { "6mo": number; "1yr": number };
  payFrequency: string;
  description: string;
}

export const bots: BotDefinition[] = [
  {
    slug: "aether-guard",
    name: "AetherGuard",
    tagline: "Safe & Steady",
    image: "/images/bots/aether-guard.jpg",
    color: "#3b82f6",
    rateRange: "0.25% to 0.6%",
    pricing: { "6mo": 25, "1yr": 40 },
    payFrequency: "1 day",
    description:
      "A capital preserving strategy tuned for traders who want steady, predictable cycles over aggressive upside.",
  },
  {
    slug: "quantum-pulse",
    name: "QuantumPulse",
    tagline: "Smart & Balanced",
    image: "/images/bots/quantum-pulse.jpg",
    color: "#8b5cf6",
    rateRange: "0.8% to 1.8%",
    pricing: { "6mo": 75, "1yr": 100 },
    payFrequency: "1 day",
    description:
      "A balanced strategy that blends momentum and mean reversion signals for consistent performance across the cycle.",
  },
  {
    slug: "titan-forge",
    name: "TitanForge",
    tagline: "Aggressive & High Reward",
    image: "/images/bots/titan-forge.jpg",
    color: "#f97316",
    rateRange: "2.0% to 4.5%",
    pricing: { "6mo": 125, "1yr": 175 },
    payFrequency: "1 day",
    description:
      "Our highest conviction strategy, built for traders comfortable trading higher volatility for higher targets.",
  },
];
