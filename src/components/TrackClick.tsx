'use client';

import * as React from 'react';
import { usePostHog } from 'posthog-js/react';

interface TrackClickProps {
  eventName: string;
  properties?: Record<string, any>;
  children: React.ReactNode;
  className?: string;
}

export function TrackClick({ eventName, properties, children, className }: TrackClickProps) {
  const posthog = usePostHog();

  const handleClick = () => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  };

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}
