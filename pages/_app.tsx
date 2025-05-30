import '../styles/global.css';
import App from '@/components/_app_custom';
import { MDXProvider } from '@mdx-js/react'; // Assuming MDXProvider might be needed for components in App or pageProps
import type { AppProps } from 'next/app';

// It's good practice to define types for props if you have custom ones
// interface MyAppProps extends AppProps {
//   // Add any custom pageProps here if necessary
// }

function MyApp({ Component, pageProps, router }: AppProps) { // Added router
  // If App component from _app_custom.tsx expects specific MDX components,
  // they should be passed via MDXProvider here.
  // For now, assuming App handles its own MDX context or doesn't need one globally.
  return (
    <MDXProvider>
      <App Component={Component} pageProps={pageProps} router={router} /> {/* Added router */}
    </MDXProvider>
  );
}

export default MyApp;
