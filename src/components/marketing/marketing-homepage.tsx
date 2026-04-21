import { CtaSection } from "@/components/marketing/cta-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { WorkflowSection } from "@/components/marketing/workflow-section";

type MarketingHomepageProps = {
  isAuthenticated: boolean;
};

export function MarketingHomepage({ isAuthenticated }: MarketingHomepageProps) {
  return (
    <main>
      <HeroSection isAuthenticated={isAuthenticated} />
      <WorkflowSection />
      <FeaturesSection />
      <CtaSection isAuthenticated={isAuthenticated} />
    </main>
  );
}
