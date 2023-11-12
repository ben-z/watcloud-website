// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { websiteConfig } from '@/lib/data'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: websiteConfig.sentry_dsn,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // TODO: reduce session sample rate in production
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,

    tunnel: websiteConfig.sentry_tunnel,

    integrations: []
  });

  // Lazy-load the Sentry Replay integration
  // https://docs.sentry.io/platforms/javascript/session-replay/#lazy-loading-replay
  import('@sentry/browser').then(({ Replay }) => {
    Sentry.addIntegration(new Replay());
  })
}