import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import siteData from "@/data/site.json";
import {
  jsonLdProps,
  personSchema,
  profilePageSchema,
  websiteSchema,
} from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import {
  Calistoga,
  Inter,
  Noto_Sans_Arabic,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Hebrew,
  Noto_Sans_Tamil,
} from "next/font/google";
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

/**
 * The intro greets in each language's own script. Inter carries none of these,
 * and the system fonts that do (Nirmala UI, Kohinoor, Noto) are per-platform
 * gambles — on a machine without them the greeting renders as empty boxes.
 * Only Devanagari is preloaded: it is the greeting the loader holds on.
 * CJK is left to the system, since those families are tens of megabytes.
 */
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "600"],
  variable: "--font-devanagari",
});
const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["500", "600"],
  variable: "--font-bengali",
  preload: false,
});
const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["500", "600"],
  variable: "--font-tamil",
  preload: false,
});
const notoGurmukhi = Noto_Sans_Gurmukhi({
  subsets: ["gurmukhi"],
  weight: ["500", "600"],
  variable: "--font-gurmukhi",
  preload: false,
});
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600"],
  variable: "--font-arabic",
  preload: false,
});
const notoHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: ["500", "600"],
  variable: "--font-hebrew",
  preload: false,
});

const scriptFontVariables = [
  notoDevanagari.variable,
  notoBengali.variable,
  notoTamil.variable,
  notoGurmukhi.variable,
  notoArabic.variable,
  notoHebrew.variable,
];

export const metadata: Metadata = {
  metadataBase: new URL(siteData.url),
  title: {
    default: "Akash Kumar Pandey | Geospatial Research Portfolio",
    template: "%s | Akash Kumar Pandey",
  },
  description:
    "Akash Kumar Pandey's portfolio for geospatial analysis, remote sensing, UAV mapping, PhenoCam research, vegetation phenology, and precision agriculture.",
  applicationName: "Akash Kumar Pandey Portfolio",
  authors: [{ name: "Akash Kumar Pandey", url: siteData.url }],
  creator: "Akash Kumar Pandey",
  publisher: "Akash Kumar Pandey",
  keywords: [
    "Akash Kumar Pandey",
    "geospatial research",
    "remote sensing",
    "precision agriculture",
    "vegetation phenology",
    "PhenoCam",
    "UAV mapping",
    "IIT Roorkee",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteData.url,
    siteName: "Akash Kumar Pandey",
    title: "Akash Kumar Pandey | Geospatial Research Portfolio",
    description:
      "Portfolio and research work in geospatial analysis, remote sensing, PhenoCam, UAV mapping, and precision agriculture.",
    images: [
      {
        url: "/img/akashpandey.com_screenshot.webp",
        width: 1200,
        height: 630,
        alt: "Akash Kumar Pandey portfolio website preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Akash Kumar Pandey | Geospatial Research Portfolio",
    description:
      "Geospatial analysis, remote sensing, PhenoCam, UAV mapping, and precision agriculture research portfolio.",
    images: ["/img/akashpandey.com_screenshot.webp"],
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
  other: {
    "last-modified": siteData.lastUpdated,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The site had no structured data at all, so nothing tied the domain
            to the person, the affiliation or the profiles that already rank
            for the name. */}
        <script {...jsonLdProps(personSchema)} />
        <script {...jsonLdProps(websiteSchema)} />
        <script {...jsonLdProps(profilePageSchema)} />
      </head>
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          inter.variable,
          calistoga.variable,
          ...scriptFontVariables,
        )}
        suppressHydrationWarning
      >
        <Providers>
          <Header />
          <div className="site-shell relative z-10 flex flex-col">
            <main className="grow">{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
