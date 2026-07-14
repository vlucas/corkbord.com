import { createRoute } from "@hyperspan/framework";
import MarketingLayout from "~/app/layouts/marketing-layout";
import { privacyPolicyContent } from "~/src/ui/legal/privacy-policy.ts";

export default createRoute().get((c) => {
  return MarketingLayout(c, {
    title: "Privacy Policy",
    variant: "legal",
    content: privacyPolicyContent(),
  });
});
