import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import siteData from "@/data/site.json";
import {
  jsonLdProps,
  personSchema,
  websiteSchema,
} from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Calistoga, Inter } from "next/font/google";
import "yet-another-react-lightbox/styles.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
const calistoga = Calistoga({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
});

const description =
  "Dr. Akash Kumar, geospatial researcher at IIT Roorkee: crop and vegetation phenology with PhenoCams, UAVs and satellite remote sensing, precision agriculture, and the Bhoomicam startup.";

export const metadata: Metadata = {
  metadataBase: new URL(siteData.url),
  title: {
    default: "Dr. Akash Kumar | Geospatial Researcher, IIT Roorkee",
    template: "%s | Dr. Akash Kumar",
  },
  description,
  applicationName: "Dr. Akash Kumar",
  authors: [{ name: "Akash Kumar", url: siteData.url }],
  creator: "Akash Kumar",
  publisher: "Akash Kumar",
  keywords: [
    "Dr. Akash Kumar",
    "Akash Kumar",
    "Akash Pandey",
    "geospatial research",
    "remote sensing",
    "precision agriculture",
    "vegetation phenology",
    "PhenoCam",
    "UAV mapping",
    "IIT Roorkee",
    "Bhoomicam",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/activities/feed.xml", title: "Activities · Dr. Akash Kumar" },
      ],
    },
  },
  // Each route segment adds its own preview image (opengraph-image.tsx).
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteData.url,
    siteName: "Dr. Akash Kumar",
    title: "Dr. Akash Kumar | Geospatial Researcher, IIT Roorkee",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr. Akash Kumar | Geospatial Researcher, IIT Roorkee",
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/favicon-192.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The paper colour of each theme (--background), for the browser chrome.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#231e1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script {...jsonLdProps(personSchema())} />
        <script {...jsonLdProps(websiteSchema)} />
      </head>
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          inter.variable,
          calistoga.variable,
        )}
        suppressHydrationWarning
      >
        <Providers>
          <Header />
          <div className="site-shell relative z-10 flex flex-col">
            <main id="main" className="grow">
              {children}
            </main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
