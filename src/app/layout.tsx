import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();

  const siteName = siteSettings?.title || "USEIT库";
  const description = siteSettings?.heroSubtitle || "网盘资源分享与推荐，涵盖电影、软件、游戏等优质内容";

  return {
    title: {
      default: siteName,
      template: `%s - ${siteName}`
    },
    description: description,
    keywords: ["网盘资源", "资源分享", "电影下载", "软件下载", "IMDB电影", "夸克网盘", "游戏资源", "USEIT库"],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: '/',
      title: siteName,
      description: description,
      siteName: siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: description,
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
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 在服务器端获取网站设置
  const siteSettings = await getSiteSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top';
  const siteName = siteSettings?.title || 'USEIT库';

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: siteName,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
    },
    description: siteSettings?.heroSubtitle || '网盘资源分享与推荐，涵盖电影、软件、游戏等优质内容',
    foundingDate: '2026',
  };

  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col"
        suppressHydrationWarning={true}
      >
        <Header siteSettings={siteSettings} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
