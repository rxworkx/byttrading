import { Hero } from "@/components/marketing/hero";
import { TradingBots } from "@/components/marketing/trading-bots";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Benefits } from "@/components/marketing/benefits";
import { SecurityTrust } from "@/components/marketing/security-trust";
import { Faq } from "@/components/marketing/faq";
import { Sponsors } from "@/components/marketing/sponsors";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TradingBots />
      <Features />
      <HowItWorks />
      <Benefits />
      <SecurityTrust />
      <Faq />
      <Sponsors />
    </>
  );
}
