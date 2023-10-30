import { DiscordIcon } from 'nextra/icons'
import { Bot, Heart, Code2 } from "lucide-react"
import websiteConfig from '@/build/fixtures/website-config.json'
import path from 'path'

const logo = (
  // This logo is designed in Sketch, exported as SVG, and then manually adjusted based on
  // https://github.com/shuding/nextra/blob/66798f8e7f92cca80f2d62d19f9db5667bcc62ef/docs/theme.config.tsx
  // The original logo can be found here: https://github.com/WATonomous/infra-config/pull/1299
  <svg height="50" viewBox="0 0 1024 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
    <title>WATcloud logo</title>
    <g id="1024x512" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="Group" transform="translate(66, 115)">
        <text id="WAT" fontFamily="Montserrat-SemiBold, Montserrat" fontSize="230" fontWeight="500" letterSpacing="4.10714286" fill="currentColor">
          <tspan x="0" y="223">WAT</tspan>
        </text>
        <g id="cloud-symbol" transform="translate(587, 0)" stroke="currentColor" strokeWidth="25">
          <path d="M65,223 C29.0554438,222.729325 0,193.507794 0,157.5 C0,121.325349 29.3253489,92 65.5,92 C69.5073357,92 73.4306193,92.3598702 77.2392962,93.0490563 C80.8069488,41.0634253 124.108036,0 177,0 C232.228475,0 277,44.771525 277,100 C277,104.563616 276.694301,109.055832 276.102264,113.457288 C293.943444,123.474837 306,142.579439 306,164.5 C306,196.485571 280.329866,222.475561 248.467404,222.992163 L247.983,222.996 L65.501,223 L65,223 Z" id="icon"></path>
        </g>
      </g>
    </g>
    {/* Styles derived from https://github.com/shuding/nextra/blob/66798f8e7f92cca80f2d62d19f9db5667bcc62ef/docs/theme.config.tsx */}
    <style jsx>{`
      svg {
        // Override the height set on the svg element
        height: var(--nextra-navbar-height);
        mask-image: linear-gradient(
          60deg,
          black 25%,
          rgba(0, 0, 0, 0.2) 50%,
          black 75%
        );
        mask-size: 400%;
        mask-position: 0%;
      }
      svg:hover {
        mask-position: 100%;
        transition:
          mask-position 1s ease,
          -webkit-mask-position 1s ease;
      }
    `}</style>
  </svg>
)

export default {
  logo,
  docsRepositoryBase: (process.env.NEXTRA_GIT_REPO_BASE_URL && process.env.NEXTRA_GIT_REF) ? path.join(process.env.NEXTRA_GIT_REPO_BASE_URL, `tree/${process.env.NEXTRA_GIT_REF}/website`) : "https://github.com/shuding/nextra/tree/main/docs",
  feedback: {
    labels: "website"
  },
  chat: {
    icon: (
      <>
        <DiscordIcon />
        <span className="nx-sr-only">Discord</span>
      </>
    ),
    link: `https://discord.gg/${websiteConfig.discord_invite_code}`
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s - WATcloud',
    }
  },
  head: () => (
    <>
      <meta name="apple-mobile-web-app-title" content="Nextra" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="icon" href="/favicon.png" type="image/png" />
      <link
        rel="icon"
        href="/favicon-dark.svg"
        type="image/svg+xml"
        media="(prefers-color-scheme: dark)"
      />
      <link
        rel="icon"
        href="/favicon-dark.png"
        type="image/png"
        media="(prefers-color-scheme: dark)"
      />
    </>
  ),
  footer: {
    text: (
      <>
        <span>
          Made with <Heart className="inline-block align-text-bottom"/> using <Code2 className="inline-block align-text-bottom"/> and <Bot className="inline-block align-text-bottom"/> by the WATcloud team.
        </span>
      </>
    )
  },
  banner: {
    text: (
      <>
        <span>
          🏗️ This website is still a work in progress. Please report any issues you find to the <a href="mailto:infra-outreach@watonomous.ca" className="underline">WATcloud team</a>.
        </span>
      </>
    ),
    dismissible: true,
    key: 'wip-banner',
  },
  toc: {
    backToTop: true,
  }
}
