'use client';

import * as React from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderLib } from 'posthog-js/react';

if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // Pageview capture can be handled manually or automatically
    });
  } else {
    console.warn(
      'Warning: NEXT_PUBLIC_POSTHOG_KEY is missing. PostHog product analytics are disabled.'
    );
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProviderLib client={posthog}>{children}</PostHogProviderLib>;
}
