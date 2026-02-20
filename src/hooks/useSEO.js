// useSEO.js — put this in src/hooks/useSEO.js
// Works with React 19, zero dependencies

import { useEffect } from "react";

/**
 * Usage in any page component:
 *
 * import useSEO from "../hooks/useSEO";
 *
 * useSEO({
 *   title: "JSON Formatter – Free Online Tool | Shaurya Tools",
 *   description: "Format and validate JSON instantly. Free, no login.",
 *   canonical: "https://shauryatools.vercel.app/json-formatter",
 * });
 */

export default function useSEO({ title, description, canonical }) {
  useEffect(() => {
    // ✅ Page title
    if (title) document.title = title;

    // ✅ Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    if (description) metaDesc.setAttribute("content", description);

    // ✅ Canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    if (canonical) canonicalTag.setAttribute("href", canonical);

    // ✅ OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) ogTitle.setAttribute("content", title);

    // ✅ OG description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) ogDesc.setAttribute("content", description);

    // ✅ OG URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl && canonical) ogUrl.setAttribute("content", canonical);

    // ✅ Twitter title
    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle && title) twTitle.setAttribute("content", title);

    // ✅ Twitter description
    let twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc && description) twDesc.setAttribute("content", description);

  }, [title, description, canonical]);
}