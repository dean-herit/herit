import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import {
  fontSans,
  dancingScript,
  greatVibes,
  pacifico,
  satisfy,
  allura,
  parisienne,
  sacramento,
  shadowsIntoLight,
  mrDafoe,
  alexBrush,
} from "@/config/fonts";
import { LayoutWrapper } from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "estate planning",
    "will",
    "inheritance",
    "legal documents",
    "Ireland",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <script async src="https://docs.opencv.org/4.x/opencv.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.Module = {
                onRuntimeInitialized() {
                  console.log('OpenCV.js WASM loaded');
                  if (window.cv) {
                    window.cv.wasmReady = true;
                  }
                }
              };
            `,
          }}
        />
      </head>
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
          dancingScript.variable,
          greatVibes.variable,
          pacifico.variable,
          satisfy.variable,
          allura.variable,
          parisienne.variable,
          sacramento.variable,
          shadowsIntoLight.variable,
          mrDafoe.variable,
          alexBrush.variable,
        )}
      >
        <Providers
          data-component-category="ui"
          data-component-id="providers"
          themeProps={{ attribute: "class", defaultTheme: "dark" }}
        >
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
