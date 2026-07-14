import {
  BarChart3,
  Gift,
  Home,
  Layers,
  Receipt,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  Wallet as WalletIcon,
  Wallet2,
  Coins,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export interface AccountNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

export interface AccountNavGroup {
  label?: string;
  items: AccountNavItem[];
}

export const accountNavGroups: AccountNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Plans", href: "/subscriptions", icon: Layers },
      { label: "Trading", href: "/trading", icon: TrendingUp },
      { label: "Fund Account", href: "/fund-account", icon: Wallet2 },
      { label: "Wallet", href: "/wallet", icon: WalletIcon },
      { label: "Transactions", href: "/transactions", icon: Receipt },
      { label: "Buy Crypto", href: siteConfig.buyCryptoUrl, icon: Coins, external: true },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Transparency", href: "/transparency", icon: BarChart3 },
      { label: "Referral", href: "/referral", icon: Users },
      { label: "Bonus", href: "/bonus", icon: Gift },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: UserRound },
      { label: "Security", href: "/security", icon: ShieldCheck },
    ],
  },
];

export const mobileQuickNav: AccountNavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Wallet", href: "/wallet", icon: WalletIcon },
  { label: "Trading", href: "/trading", icon: TrendingUp },
  { label: "Transactions", href: "/transactions", icon: Receipt },
];
