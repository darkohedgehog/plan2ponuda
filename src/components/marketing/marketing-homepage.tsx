import { CtaSection } from "@/components/marketing/cta-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { PlanCtaSection } from "@/components/marketing/plan-cta-section";
import { ProductDepthSection } from "@/components/marketing/product-depth-section";
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
      <ProductDepthSection />
      <PlanCtaSection isAuthenticated={isAuthenticated} />
      <CtaSection isAuthenticated={isAuthenticated} />
    </main>
  );
}
