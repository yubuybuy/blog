import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "我的博客",
    template: "%s - 我的博客"
  },
  description: "分享技术、生活和思考，记录成长的点点滴滴",
  keywords: ["博客", "技术", "生活", "思考", "前端", "开发"],
  authors: [{ name: "博客作者" }],
  creator: "博客作者",
  publisher: "博客作者",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    title: '我的博客',
    description: '分享技术、生活和思考，记录成长的点点滴滴',
    siteName: '我的博客',
  },
  twitter: {
    card: 'summary_large_image',
    title: '我的博客',
    description: '分享技术、生活和思考，记录成长的点点滴滴',
    creator: '@yourusername',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
