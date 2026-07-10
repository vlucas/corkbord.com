import { createConfig } from "@hyperspan/framework";
import { ensureScheduler } from "~/src/server/ingest";

export default createConfig({
  appDir: "./app",
  publicDir: "./public",

  beforeRoutesAdded() {
    ensureScheduler();
  },
});
