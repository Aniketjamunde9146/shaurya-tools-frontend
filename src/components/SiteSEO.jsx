import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { tools } from "../data/toolsData";

export const SITE_URL = "https://shauryatools.vercel.app";

const DEFAULT_DESCRIPTION =
  "Free online tools for developers, creators, students, and everyday tasks. No login, no signup, and instant results.";

function titleFromSlug(pathname) {
  const slug = pathname.replace(/^\//, "").replace(/-/g, " ");
  return slug ? `${slug.replace(/\b\w/g, letter => letter.toUpperCase())} | Shaurya Tools` : "Free Online Tools | Shaurya Tools";
}

export default function SiteSEO() {
  const { pathname } = useLocation();
  const tool = tools.find(item => `/${item.slug}` === pathname);
  const canonical = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
  const title = tool ? `${tool.name} | Free Online Tool | Shaurya Tools` : titleFromSlug(pathname);
  const description = tool?.description || DEFAULT_DESCRIPTION;
  const pageType = pathname === "/" ? "WebSite" : "WebPage";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": pageType,
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: tool ? { "@type": "SoftwareApplication", name: tool.name, applicationCategory: "UtilitiesApplication" } : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "Shaurya Tools",
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Shaurya Tools",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo.png`,
        sameAs: ["https://instagram.com/aniket_jamunde_002", "https://github.com/Aniketjamunde9146"],
        maintainer: { "@type": "Organization", name: "aniketwebdev.in", url: "https://aniketwebdev.in" },
      },
    ],
  };

  return (
    <Helmet>
      <html lang="en" />
      <meta name="author" content="Shaurya Tools" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="theme-color" content="#6c47ff" />
      <meta property="og:type" content={pathname === "/" ? "website" : "article"} />
      <meta property="og:site_name" content="Shaurya Tools" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
      <meta property="og:image:alt" content={`${title} - Shaurya Tools`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      <link rel="canonical" href={canonical} />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
