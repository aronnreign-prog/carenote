import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0E14",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://carenote.in"),
  title: "CareNote: Temporal Graph Memory & Verifiable PaperTrail",
  description:
    "Medical history is an evolving graph over time, not disconnected text chunks. CareNote stores clinical facts in persistent bi-temporal memory with an instant PaperTrail linking every claim to its source record page.",
  alternates: {
    canonical: "https://carenote.in",
  },
  openGraph: {
    title: "CareNote: Temporal Graph Memory & Verifiable PaperTrail",
    description:
      "Transforming fragmented clinical encounter PDFs into an evolving bi-temporal patient knowledge graph with 100% source-verified PaperTrail citations.",
    url: "https://carenote.in",
    siteName: "CareNote",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "CareNote: Longitudinal Clinical Memory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareNote: Temporal Graph Memory & Verifiable PaperTrail",
    description:
      "Medical history is an evolving graph over time, not disconnected text chunks. CareNote synthesizes patient records with verified PaperTrail citations.",
    images: ["/logo.png"],
  },
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
  icons: {
    icon: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://carenote.in/#software",
      name: "CareNote",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      description:
        "Longitudinal clinical memory and synthesis engine that models patient medical records as an evolving bi-temporal knowledge graph with verified PaperTrail citations.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://carenote.in/#organization",
      name: "CareNote",
      url: "https://carenote.in",
      logo: "https://carenote.in/logo.png",
    },
    {
      "@type": "MedicalWebPage",
      "@id": "https://carenote.in/#webpage",
      url: "https://carenote.in",
      name: "CareNote: Longitudinal Clinical Memory & Verifiable PaperTrail",
      description:
        "CareNote turns fragmented clinical encounter PDFs into an evolving bi-temporal patient knowledge graph with direct PaperTrail citations linking claims to source PDF pages.",
      audience: {
        "@type": "MedicalAudience",
        audienceType: "Clinicians, Care Coordinators, and Patients",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://carenote.in/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is CareNote and how does it synthesize clinical records?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CareNote is a longitudinal clinical memory engine that transforms fragmented medical encounter PDFs into a persistent bi-temporal knowledge graph. It extracts structured medications, lab panels, and conditions with encounter dates and physical page numbers, producing clinical syntheses where every assertion is backed by verifiable source proof.",
          },
        },
        {
          "@type": "Question",
          name: "Why do standard vector RAG tools fail on longitudinal medical records?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Standard vector RAG chops PDFs into isolated paragraphs, causing temporal blindness. It retrieves superseded medications alongside active ones, repeats copy-forwarded problem list labels without checking confirmatory diagnostic tests, and cannot trace multi-encounter prescribing cascades across different healthcare providers.",
          },
        },
        {
          "@type": "Question",
          name: "What is The PaperTrail verification in CareNote?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The PaperTrail is CareNote's zero-blind-trust verification mechanism. Every clinical assertion in a synthesis carries an interactive claim marker classified as SUPPORTED, CONFLICTING, notable absence, or MEDICAL KNOWLEDGE. Clicking a citation streams the authentic source PDF directly to the cited page with verbatim excerpts.",
          },
        },
        {
          "@type": "Question",
          name: "How does CareNote identify prescribing cascades and chart lore?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "By modeling encounters across time in a bi-temporal graph, CareNote links drug initiations to subsequent symptoms and follow-on prescriptions. It compares unverified problem list labels against primary diagnostic tests to refute inaccurate chart lore and flags unclosed therapeutic holds when recovery criteria are satisfied.",
          },
        },
        {
          "@type": "Question",
          name: "Who benefits from using CareNote?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CareNote is designed for patients and family caregivers managing complex chronic conditions, independent care coordinators navigating multi-provider medical records, and specialist clinicians conducting comprehensive pre-visit chart reviews.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark bg-background h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
