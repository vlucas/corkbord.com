import { createRoute } from "@hyperspan/framework";
import MarketingLayout from "~/app/layouts/marketing-layout";
import { termsOfServiceContent } from "~/src/ui/legal/terms-of-service.ts";

export default createRoute().get((c) => {
  return MarketingLayout(c, {
    title: "Terms of Service",
    variant: "legal",
    content: termsOfServiceContent(),
  });
});
