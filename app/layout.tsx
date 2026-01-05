import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Doto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://calendux.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Calendux | AI-Powered Intelligent Calendar",
    template: "%s | Calendux",
  },
  description:
    "Calendux is an AI-powered calendar that intelligently optimizes your schedule, prevents burnout, and helps you achieve work-life balance with smart scheduling insights.",
  keywords: [
    "calendar",
    "AI calendar",
    "smart scheduling",
    "schedule optimizer",
    "productivity",
    "time management",
    "burnout prevention",
    "work-life balance",
    "intelligent calendar",
    "task management",
  ],
  authors: [{ name: "Calendux Team" }],
  creator: "Calendux",
  publisher: "Calendux",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Calendux",
    title: "Calendux | AI-Powered Intelligent Calendar",
    description:
      "Optimize your schedule with AI. Prevent burnout, balance your workload, and achieve more with Calendux.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Calendux - AI-Powered Intelligent Calendar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calendux | AI-Powered Intelligent Calendar",
    description:
      "Optimize your schedule with AI. Prevent burnout, balance your workload, and achieve more.",
    images: ["/og-image.png"],
    creator: "@calendux",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
  category: "productivity",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${doto.variable} ${instrumentSerif.variable} antialiased font-sans`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
