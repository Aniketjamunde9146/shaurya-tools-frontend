import fs from "node:fs";
import path from "node:path";
import { tools } from "../src/data/toolsData.js";

const siteUrl = process.env.SITE_URL || "https://shauryatools.vercel.app";
const lastmod = new Date().toISOString().slice(0, 10);
const escapeXml = value => value.replace(/[<>&'\"]/g, character => ({
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
}[character]));

const routes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  ...tools.map(tool => ({ path: `/${tool.slug}`, priority: "0.8", changefreq: "monthly" })),
];

const urls = routes.map(({ path: routePath, priority, changefreq }) => `  <url>\n    <loc>${escapeXml(`${siteUrl}${routePath}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

fs.writeFileSync(path.resolve("public/sitemap.xml"), sitemap);
console.log(`Generated ${routes.length} sitemap URLs for ${siteUrl}`);

const groupedTools = tools.reduce((groups, tool) => {
  const category = tool.category || "Tools";
  if (!groups[category]) groups[category] = [];
  groups[category].push(tool);
  return groups;
}, {});

const toolSections = Object.entries(groupedTools).map(([category, categoryTools]) => {
  const links = categoryTools
    .map(tool => `- [${tool.name}](${siteUrl}/${tool.slug}): ${tool.description}`)
    .join("\n");
  return `## ${category}\n\n${links}`;
}).join("\n\n");

const llms = `# Shaurya Tools

> Free browser-based tools for developers, creators, students, and everyday tasks. Tools run directly in the browser where possible, with no login required.

Shaurya Tools provides focused utilities for formatting, generating, converting, calculating, writing, image editing, and SEO workflows. Each tool has a stable direct URL and a descriptive page title.

## Important Pages

- [Homepage](${siteUrl}/): Browse and search all available tools.
- [XML Sitemap](${siteUrl}/sitemap.xml): Complete crawlable URL inventory.

${toolSections}
`;

fs.writeFileSync(path.resolve("public/llms.txt"), llms);
console.log(`Generated public/llms.txt with ${tools.length} tool links`);
