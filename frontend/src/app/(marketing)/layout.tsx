import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { JoinUs } from "@/components/marketing/join-us";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <JoinUs />
      <Footer />
    </>
  );
}
