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
    "CareNote is a research-stage prototype testing whether a patient-specific graph helps reviewers reconstruct changing clinical state across fragmented records. Source record and page anchors are inspectable when available.",
  alternates: {
    canonical: "https://carenote.in",
  },
  openGraph: {
    title: "CareNote: Temporal Graph Memory & Verifiable PaperTrail",
    description:
      "A research-stage prototype for longitudinal clinical-record review, with a patient-specific graph and an inspectable source-page workflow.",
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
      "CareNote is exploring whether a patient-specific graph helps reviewers reconstruct changing clinical state from fragmented records.",
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
        "Research-stage prototype that indexes clinical-record PDFs into patient-specific graph memory and generates longitudinal syntheses with inspectable source anchors when available.",
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
        "CareNote is a research-stage prototype exploring patient-specific graph memory for longitudinal clinical-record review. Source record and page anchors are inspectable when available; clinical performance has not been validated.",
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
            text: "CareNote is a research-stage prototype that indexes uploaded clinical-record PDFs into patient-specific graph memory and generates longitudinal syntheses with structured claim evidence. It is exploring whether this helps reviewers reconstruct changing clinical state and inspect evidence across time. It has no external pilot proof or clinical outcome evidence.",
          },
        },
        {
          "@type": "Question",
          name: "What is CareNote testing?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CareNote is testing whether a patient-specific graph helps a knowledgeable reviewer reconstruct changing clinical state and inspect relationships across fragmented records. Comparative performance against ordinary search or other systems has not been established.",
          },
        },
        {
          "@type": "Question",
          name: "What does the PaperTrail structural check do?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The PaperTrail structural check verifies that claim markers match claim records and that source-backed claims reference record/page anchors present in retrieved context. It does not verify that the model interpreted a source correctly, that a quotation entails a claim, or that a result is clinically accurate.",
          },
        },
        {
          "@type": "Question",
          name: "What are the limitations of CareNote?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CareNote retrieves graph entities, dated record episodes, and temporal relationships for a reviewer to inspect. The product has not been independently evaluated for detecting prescribing cascades, contradictions, or unresolved follow-up.",
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
