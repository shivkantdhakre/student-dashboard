import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "academia-ai",
  project: "student-dashboard",

  // Only print logs for uploading source maps in CI or production builds
  silent: !process.env.CI,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
