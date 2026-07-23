import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { TelegramIcon, WhatsAppIcon } from "@/components/layout/social-icons";
import { footerNav, siteConfig, socialLinks } from "@/lib/site-config";

const socialIconMap = {
  WhatsApp: WhatsAppIcon,
  Telegram: TelegramIcon,
};

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size="md" />
            <p className="mt-4 max-w-xs text-base leading-relaxed text-muted-foreground">
              Automated trading bots that put your capital to work on fixed, transparent cycles. Deposit,
              subscribe, trade, and watch your balance grow with full visibility at every step.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground">Company</h4>
            <ul className="mt-5 space-y-3.5">
              {footerNav.company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-base text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground">Legal</h4>
            <ul className="mt-5 space-y-3.5">
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-base text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground">Contact</h4>
            <ul className="mt-5 space-y-3.5 text-base text-muted-foreground">
              <li>{siteConfig.address}</li>
              <li>
                <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-foreground">
                  {siteConfig.supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-hairline pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-5">
            {socialLinks.map((social) => {
              const Icon = socialIconMap[social.label as keyof typeof socialIconMap];
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon className="size-6" />
                </a>
              );
            })}
          </div>

          <div className="max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-right">
            <p>© 2026 BYT Trading, all rights reserved.</p>
            <p className="mt-2">
              Disclaimer: Trading digital assets involves substantial risk of loss and is not suitable for
              every investor. Past or projected performance of any bot strategy is not a guarantee of
              future results. BYT Trading does not provide financial advice, so evaluate your own risk
              tolerance and consult an independent advisor before subscribing to any plan.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
