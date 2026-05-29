import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Calistoga, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.akashpandey.com"),
  title: {
    default: "Akash Kumar Pandey | Geospatial Research Portfolio",
    template: "%s | Akash Kumar Pandey",
  },
  description:
    "Akash Kumar Pandey's portfolio for geospatial analysis, remote sensing, UAV mapping, PhenoCam research, vegetation phenology, and precision agriculture.",
  applicationName: "Akash Kumar Pandey Portfolio",
  authors: [{ name: "Akash Kumar Pandey", url: "https://www.akashpandey.com" }],
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
    url: "https://www.akashpandey.com",
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
    icon: [{ url: "/favicon2.png", type: "image/png" }],
    apple: "/favicon1.png",
  },
  manifest: "/manifest.json",
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
          <div className="mx-auto flex max-w-4xl flex-col px-6 sm:px-8">
            <main className="grow">{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
