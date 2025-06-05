import nextra from 'nextra'
import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const baseConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    // output: export doesn't support Next.js image optimization
    unoptimized: true,
  },
  // Next.js doesn't support trailing slashes in basePath
  // This config needs to be in sync with export-images.config.js
  basePath: (process.env.WEBSITE_BASE_PATH || '').replace(/\/$/, ''),
  webpack: (config) => {
    // Add Typescript support
    // Reference: https://www.altogic.com/blog/nextjs-typescript
    config.resolve.extensions.push('.ts', '.tsx')
    return config
  },
  eslint: {
    dirs: [
      'pages',
      'src',
      'app',
      'components',
      'lib',
      'theme.config.tsx',
      'tailwind.config.js',
      'next.config.mjs',
      'postcss.config.js',
    ]
  }
}

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  latex: true, // LaTeX support: https://nextra.site/docs/guide/advanced/latex
})

const sentryPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  silent: false,
  // These variables are set in CI to enable source map uploading
  org: process.env.WATCLOUD_WEBSITE_SENTRY_ORG,
  project: process.env.WATCLOUD_WEBSITE_SENTRY_PROJECT,
  authToken: process.env.WATCLOUD_WEBSITE_SENTRY_AUTH_TOKEN,
}

const sentryNextOptions = {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  // tunnelRoute: '/monitoring',
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(
  withSentryConfig(withNextra(baseConfig), sentryPluginOptions, sentryNextOptions)
)
