/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import "./SchemaMarkupGenerator.css";

/* ── Icons ── */
const IconSchema = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

/* ══════════════════════════════════════════════
   SCHEMA TYPE DEFINITIONS
══════════════════════════════════════════════ */
const SCHEMA_TYPES = [
  { id: "Article",       label: "Article",         emoji: "📰", desc: "Blog posts, news, content" },
  { id: "Product",       label: "Product",          emoji: "🛍️", desc: "E-commerce products"       },
  { id: "FAQ",           label: "FAQ Page",         emoji: "❓", desc: "Frequently asked questions" },
  { id: "LocalBusiness", label: "Local Business",   emoji: "🏪", desc: "Stores, restaurants, offices" },
  { id: "Person",        label: "Person",           emoji: "👤", desc: "Author or person profile"   },
  { id: "Event",         label: "Event",            emoji: "🎟️", desc: "Concerts, webinars, meetups" },
  { id: "Recipe",        label: "Recipe",           emoji: "🍳", desc: "Food recipes with steps"    },
  { id: "Review",        label: "Review",           emoji: "⭐", desc: "Product or business review"  },
  { id: "BreadcrumbList",label: "Breadcrumbs",      emoji: "🔗", desc: "Page navigation breadcrumbs" },
  { id: "VideoObject",   label: "Video",            emoji: "🎬", desc: "YouTube or hosted video"     },
  { id: "WebSite",       label: "Website",          emoji: "🌐", desc: "Sitelinks search box"        },
  { id: "Organization",  label: "Organization",     emoji: "🏢", desc: "Company or nonprofit info"   },
];

/* ── Field definitions per schema type ── */
const FIELDS = {
  Article: [
    { key: "headline",        label: "Headline",          type: "text",     placeholder: "My Article Title",          required: true },
    { key: "description",     label: "Description",       type: "textarea", placeholder: "Brief description...",      required: true },
    { key: "url",             label: "Article URL",       type: "url",      placeholder: "https://example.com/article" },
    { key: "image",           label: "Featured Image URL",type: "url",      placeholder: "https://example.com/img.jpg" },
    { key: "datePublished",   label: "Date Published",    type: "date",     placeholder: "" },
    { key: "dateModified",    label: "Date Modified",     type: "date",     placeholder: "" },
    { key: "authorName",      label: "Author Name",       type: "text",     placeholder: "Jane Doe" },
    { key: "authorUrl",       label: "Author URL",        type: "url",      placeholder: "https://example.com/jane" },
    { key: "publisherName",   label: "Publisher Name",    type: "text",     placeholder: "My Blog" },
    { key: "publisherLogo",   label: "Publisher Logo URL",type: "url",      placeholder: "https://example.com/logo.png" },
  ],

  Product: [
    { key: "name",            label: "Product Name",      type: "text",     placeholder: "Wireless Headphones",        required: true },
    { key: "description",     label: "Description",       type: "textarea", placeholder: "Product description..." },
    { key: "image",           label: "Product Image URL", type: "url",      placeholder: "https://example.com/product.jpg" },
    { key: "sku",             label: "SKU",               type: "text",     placeholder: "WH-1234" },
    { key: "brand",           label: "Brand",             type: "text",     placeholder: "Sony" },
    { key: "price",           label: "Price",             type: "text",     placeholder: "99.99" },
    { key: "currency",        label: "Currency",          type: "select",   options: ["USD","EUR","GBP","INR","CAD","AUD","JPY"], placeholder: "" },
    { key: "availability",    label: "Availability",      type: "select",   options: ["InStock","OutOfStock","PreOrder","Discontinued"], placeholder: "" },
    { key: "url",             label: "Product URL",       type: "url",      placeholder: "https://example.com/product" },
    { key: "ratingValue",     label: "Rating (1–5)",      type: "text",     placeholder: "4.5" },
    { key: "reviewCount",     label: "Review Count",      type: "text",     placeholder: "128" },
  ],

  FAQ: [
    { key: "_faq",            label: "FAQ Items",         type: "faq",      placeholder: "" },
  ],

  LocalBusiness: [
    { key: "name",            label: "Business Name",     type: "text",     placeholder: "Joe's Coffee",               required: true },
    { key: "description",     label: "Description",       type: "textarea", placeholder: "What your business does..." },
    { key: "url",             label: "Website URL",       type: "url",      placeholder: "https://example.com" },
    { key: "image",           label: "Business Image URL",type: "url",      placeholder: "https://example.com/shop.jpg" },
    { key: "telephone",       label: "Phone",             type: "text",     placeholder: "+1-800-555-0100" },
    { key: "email",           label: "Email",             type: "text",     placeholder: "hello@business.com" },
    { key: "streetAddress",   label: "Street Address",    type: "text",     placeholder: "123 Main St" },
    { key: "city",            label: "City",              type: "text",     placeholder: "New York" },
    { key: "state",           label: "State / Region",    type: "text",     placeholder: "NY" },
    { key: "postalCode",      label: "Postal Code",       type: "text",     placeholder: "10001" },
    { key: "country",         label: "Country",           type: "text",     placeholder: "US" },
    { key: "priceRange",      label: "Price Range",       type: "text",     placeholder: "$$" },
    { key: "openingHours",    label: "Opening Hours",     type: "text",     placeholder: "Mo-Fr 09:00-18:00" },
    { key: "ratingValue",     label: "Rating (1–5)",      type: "text",     placeholder: "4.7" },
    { key: "reviewCount",     label: "Review Count",      type: "text",     placeholder: "342" },
  ],

  Person: [
    { key: "name",            label: "Full Name",         type: "text",     placeholder: "Jane Doe",                   required: true },
    { key: "jobTitle",        label: "Job Title",         type: "text",     placeholder: "Software Engineer" },
    { key: "description",     label: "Bio",               type: "textarea", placeholder: "About this person..." },
    { key: "url",             label: "Profile URL",       type: "url",      placeholder: "https://example.com/jane" },
    { key: "image",           label: "Photo URL",         type: "url",      placeholder: "https://example.com/jane.jpg" },
    { key: "email",           label: "Email",             type: "text",     placeholder: "jane@example.com" },
    { key: "telephone",       label: "Phone",             type: "text",     placeholder: "+1-800-555-0100" },
    { key: "sameAs",          label: "Social Profiles (comma-separated)", type: "text", placeholder: "https://twitter.com/jane, https://linkedin.com/in/jane" },
  ],

  Event: [
    { key: "name",            label: "Event Name",        type: "text",     placeholder: "Annual Tech Summit",         required: true },
    { key: "description",     label: "Description",       type: "textarea", placeholder: "Event description..." },
    { key: "startDate",       label: "Start Date & Time", type: "datetime-local", placeholder: "" },
    { key: "endDate",         label: "End Date & Time",   type: "datetime-local", placeholder: "" },
    { key: "url",             label: "Event URL",         type: "url",      placeholder: "https://example.com/event" },
    { key: "image",           label: "Event Image URL",   type: "url",      placeholder: "https://example.com/event.jpg" },
    { key: "venueName",       label: "Venue Name",        type: "text",     placeholder: "Madison Square Garden" },
    { key: "venueAddress",    label: "Venue Address",     type: "text",     placeholder: "4 Pennsylvania Plaza, New York" },
    { key: "eventMode",       label: "Event Mode",        type: "select",   options: ["OfflineEventAttendanceMode","OnlineEventAttendanceMode","MixedEventAttendanceMode"], placeholder: "" },
    { key: "status",          label: "Event Status",      type: "select",   options: ["EventScheduled","EventCancelled","EventPostponed","EventRescheduled"], placeholder: "" },
    { key: "price",           label: "Ticket Price",      type: "text",     placeholder: "25.00 (0 for free)" },
    { key: "currency",        label: "Currency",          type: "select",   options: ["USD","EUR","GBP","INR","CAD","AUD"], placeholder: "" },
    { key: "organizerName",   label: "Organizer Name",    type: "text",     placeholder: "Tech Events Inc." },
  ],

  Recipe: [
    { key: "name",            label: "Recipe Name",       type: "text",     placeholder: "Classic Chocolate Cake",     required: true },
    { key: "description",     label: "Description",       type: "textarea", placeholder: "A delicious recipe..." },
    { key: "image",           label: "Recipe Image URL",  type: "url",      placeholder: "https://example.com/cake.jpg" },
    { key: "author",          label: "Author",            type: "text",     placeholder: "Chef Julia" },
    { key: "prepTime",        label: "Prep Time (mins)",  type: "text",     placeholder: "20" },
    { key: "cookTime",        label: "Cook Time (mins)",  type: "text",     placeholder: "45" },
    { key: "servings",        label: "Servings",          type: "text",     placeholder: "8" },
    { key: "calories",        label: "Calories per serving", type: "text",  placeholder: "350" },
    { key: "ingredients",     label: "Ingredients (one per line)", type: "textarea", placeholder: "2 cups flour\n1 cup sugar\n3 eggs" },
    { key: "instructions",    label: "Instructions (one step per line)", type: "textarea", placeholder: "Preheat oven to 350°F\nMix dry ingredients\nBake for 45 minutes" },
    { key: "ratingValue",     label: "Rating (1–5)",      type: "text",     placeholder: "4.8" },
    { key: "reviewCount",     label: "Review Count",      type: "text",     placeholder: "56" },
  ],

  Review: [
    { key: "itemName",        label: "Item Being Reviewed", type: "text",   placeholder: "Sony WH-1000XM5",            required: true },
    { key: "itemType",        label: "Item Type",           type: "select", options: ["Product","Book","Movie","LocalBusiness","Software","Course"], placeholder: "" },
    { key: "reviewBody",      label: "Review Text",         type: "textarea", placeholder: "This product is amazing..." },
    { key: "ratingValue",     label: "Rating (1–5)",        type: "text",   placeholder: "4.5",                        required: true },
    { key: "bestRating",      label: "Best Rating",         type: "text",   placeholder: "5" },
    { key: "authorName",      label: "Reviewer Name",       type: "text",   placeholder: "John Smith" },
    { key: "datePublished",   label: "Review Date",         type: "date",   placeholder: "" },
    { key: "url",             label: "Review URL",          type: "url",    placeholder: "https://example.com/review" },
  ],

  BreadcrumbList: [
    { key: "_breadcrumbs",    label: "Breadcrumb Items",    type: "breadcrumbs", placeholder: "" },
  ],

  VideoObject: [
    { key: "name",            label: "Video Title",         type: "text",    placeholder: "How to Code in Python",    required: true },
    { key: "description",     label: "Description",         type: "textarea",placeholder: "Video description..." },
    { key: "thumbnailUrl",    label: "Thumbnail URL",       type: "url",     placeholder: "https://example.com/thumb.jpg" },
    { key: "uploadDate",      label: "Upload Date",         type: "date",    placeholder: "" },
    { key: "duration",        label: "Duration (ISO 8601)", type: "text",    placeholder: "PT5M30S (5 min 30 sec)" },
    { key: "contentUrl",      label: "Video File URL",      type: "url",     placeholder: "https://example.com/video.mp4" },
    { key: "embedUrl",        label: "Embed URL",           type: "url",     placeholder: "https://www.youtube.com/embed/xxxx" },
    { key: "url",             label: "Watch Page URL",      type: "url",     placeholder: "https://youtube.com/watch?v=xxxx" },
  ],

  WebSite: [
    { key: "name",            label: "Website Name",        type: "text",    placeholder: "My Awesome Site",          required: true },
    { key: "url",             label: "Website URL",         type: "url",     placeholder: "https://example.com",      required: true },
    { key: "description",     label: "Description",         type: "textarea",placeholder: "What this website is about..." },
    { key: "searchUrl",       label: "Search URL Template", type: "url",     placeholder: "https://example.com/search?q={search_term_string}" },
  ],

  Organization: [
    { key: "name",            label: "Organization Name",   type: "text",    placeholder: "Acme Corporation",         required: true },
    { key: "url",             label: "Website URL",         type: "url",     placeholder: "https://example.com",      required: true },
    { key: "logo",            label: "Logo URL",            type: "url",     placeholder: "https://example.com/logo.png" },
    { key: "description",     label: "Description",         type: "textarea",placeholder: "What your organization does..." },
    { key: "email",           label: "Email",               type: "text",    placeholder: "hello@acme.com" },
    { key: "telephone",       label: "Phone",               type: "text",    placeholder: "+1-800-555-0100" },
    { key: "address",         label: "Street Address",      type: "text",    placeholder: "123 Main St, New York, NY 10001" },
    { key: "sameAs",          label: "Social Profiles (comma-separated)", type: "text", placeholder: "https://twitter.com/acme, https://linkedin.com/company/acme" },
    { key: "foundingDate",    label: "Founding Year",       type: "text",    placeholder: "2010" },
  ],
};

/* ══════════════════════════════════════════════
   JSON-LD GENERATORS
══════════════════════════════════════════════ */
function buildSchema(type, fields, faqItems, breadcrumbs) {
  const f = fields;
  const clean = v => v?.trim() || undefined;
  const num   = v => v?.trim() ? parseFloat(v) : undefined;
  const arr   = v => v?.trim() ? v.split(",").map(s => s.trim()).filter(Boolean) : undefined;

  const base = { "@context": "https://schema.org", "@type": type };

  switch (type) {
    case "Article":
      return {
        ...base,
        headline:       clean(f.headline),
        description:    clean(f.description),
        url:            clean(f.url),
        image:          clean(f.image) ? [clean(f.image)] : undefined,
        datePublished:  clean(f.datePublished),
        dateModified:   clean(f.dateModified) || clean(f.datePublished),
        author:         clean(f.authorName) ? { "@type": "Person", name: clean(f.authorName), url: clean(f.authorUrl) } : undefined,
        publisher:      clean(f.publisherName) ? {
          "@type": "Organization",
          name:    clean(f.publisherName),
          logo:    clean(f.publisherLogo) ? { "@type": "ImageObject", url: clean(f.publisherLogo) } : undefined,
        } : undefined,
      };

    case "Product":
      return {
        ...base,
        name:        clean(f.name),
        description: clean(f.description),
        image:       clean(f.image),
        sku:         clean(f.sku),
        brand:       clean(f.brand) ? { "@type": "Brand", name: clean(f.brand) } : undefined,
        offers:      clean(f.price) ? {
          "@type":       "Offer",
          price:         clean(f.price),
          priceCurrency: clean(f.currency) || "USD",
          availability:  clean(f.availability) ? `https://schema.org/${clean(f.availability)}` : "https://schema.org/InStock",
          url:           clean(f.url),
        } : undefined,
        aggregateRating: clean(f.ratingValue) ? {
          "@type":      "AggregateRating",
          ratingValue:  clean(f.ratingValue),
          reviewCount:  clean(f.reviewCount) || "1",
        } : undefined,
      };

    case "FAQ":
      return {
        ...base,
        mainEntity: faqItems.filter(q => q.q.trim() && q.a.trim()).map(q => ({
          "@type":          "Question",
          name:             q.q.trim(),
          acceptedAnswer:   { "@type": "Answer", text: q.a.trim() },
        })),
      };

    case "LocalBusiness":
      return {
        ...base,
        name:          clean(f.name),
        description:   clean(f.description),
        url:           clean(f.url),
        image:         clean(f.image),
        telephone:     clean(f.telephone),
        email:         clean(f.email),
        priceRange:    clean(f.priceRange),
        openingHours:  clean(f.openingHours),
        address:       (clean(f.streetAddress) || clean(f.city)) ? {
          "@type":           "PostalAddress",
          streetAddress:     clean(f.streetAddress),
          addressLocality:   clean(f.city),
          addressRegion:     clean(f.state),
          postalCode:        clean(f.postalCode),
          addressCountry:    clean(f.country),
        } : undefined,
        aggregateRating: clean(f.ratingValue) ? {
          "@type":      "AggregateRating",
          ratingValue:  clean(f.ratingValue),
          reviewCount:  clean(f.reviewCount) || "1",
        } : undefined,
      };

    case "Person":
      return {
        ...base,
        name:      clean(f.name),
        jobTitle:  clean(f.jobTitle),
        description: clean(f.description),
        url:       clean(f.url),
        image:     clean(f.image),
        email:     clean(f.email),
        telephone: clean(f.telephone),
        sameAs:    arr(f.sameAs),
      };

    case "Event":
      return {
        ...base,
        name:        clean(f.name),
        description: clean(f.description),
        startDate:   clean(f.startDate),
        endDate:     clean(f.endDate),
        url:         clean(f.url),
        image:       clean(f.image) ? [clean(f.image)] : undefined,
        eventAttendanceMode: clean(f.eventMode) ? `https://schema.org/${clean(f.eventMode)}` : undefined,
        eventStatus: clean(f.status) ? `https://schema.org/${clean(f.status)}` : "https://schema.org/EventScheduled",
        location:    clean(f.venueName) ? {
          "@type": clean(f.eventMode) === "OnlineEventAttendanceMode" ? "VirtualLocation" : "Place",
          name:    clean(f.venueName),
          address: clean(f.venueAddress),
        } : undefined,
        offers:      clean(f.price) ? {
          "@type":       "Offer",
          price:         clean(f.price),
          priceCurrency: clean(f.currency) || "USD",
          availability:  "https://schema.org/InStock",
        } : undefined,
        organizer:   clean(f.organizerName) ? { "@type": "Organization", name: clean(f.organizerName) } : undefined,
      };

    case "Recipe":
      return {
        ...base,
        name:          clean(f.name),
        description:   clean(f.description),
        image:         clean(f.image) ? [clean(f.image)] : undefined,
        author:        clean(f.author) ? { "@type": "Person", name: clean(f.author) } : undefined,
        prepTime:      clean(f.prepTime) ? `PT${clean(f.prepTime)}M` : undefined,
        cookTime:      clean(f.cookTime) ? `PT${clean(f.cookTime)}M` : undefined,
        totalTime:     (clean(f.prepTime) && clean(f.cookTime))
                         ? `PT${parseInt(f.prepTime)+parseInt(f.cookTime)}M` : undefined,
        recipeYield:   clean(f.servings) ? `${clean(f.servings)} servings` : undefined,
        nutrition:     clean(f.calories) ? { "@type": "NutritionInformation", calories: `${clean(f.calories)} calories` } : undefined,
        recipeIngredient: clean(f.ingredients) ? f.ingredients.split("\n").map(s=>s.trim()).filter(Boolean) : undefined,
        recipeInstructions: clean(f.instructions) ? f.instructions.split("\n").map((s,i)=>({
          "@type": "HowToStep",
          text:    s.trim(),
          position: i + 1,
        })).filter(s=>s.text) : undefined,
        aggregateRating: clean(f.ratingValue) ? {
          "@type":      "AggregateRating",
          ratingValue:  clean(f.ratingValue),
          reviewCount:  clean(f.reviewCount) || "1",
        } : undefined,
      };

    case "Review":
      return {
        ...base,
        itemReviewed: {
          "@type": clean(f.itemType) || "Product",
          name:    clean(f.itemName),
        },
        reviewBody:     clean(f.reviewBody),
        reviewRating:   {
          "@type":      "Rating",
          ratingValue:  clean(f.ratingValue),
          bestRating:   clean(f.bestRating) || "5",
        },
        author:         clean(f.authorName) ? { "@type": "Person", name: clean(f.authorName) } : undefined,
        datePublished:  clean(f.datePublished),
        url:            clean(f.url),
      };

    case "BreadcrumbList":
      return {
        ...base,
        itemListElement: breadcrumbs.filter(b => b.name.trim()).map((b, i) => ({
          "@type":    "ListItem",
          position:   i + 1,
          name:       b.name.trim(),
          item:       b.url.trim() || undefined,
        })),
      };

    case "VideoObject":
      return {
        ...base,
        name:           clean(f.name),
        description:    clean(f.description),
        thumbnailUrl:   clean(f.thumbnailUrl) ? [clean(f.thumbnailUrl)] : undefined,
        uploadDate:     clean(f.uploadDate),
        duration:       clean(f.duration),
        contentUrl:     clean(f.contentUrl),
        embedUrl:       clean(f.embedUrl),
        url:            clean(f.url),
      };

    case "WebSite":
      return {
        ...base,
        name:        clean(f.name),
        url:         clean(f.url),
        description: clean(f.description),
        potentialAction: clean(f.searchUrl) ? {
          "@type":       "SearchAction",
          target:        { "@type": "EntryPoint", urlTemplate: clean(f.searchUrl) },
          "query-input": "required name=search_term_string",
        } : undefined,
      };

    case "Organization":
      return {
        ...base,
        name:        clean(f.name),
        url:         clean(f.url),
        logo:        clean(f.logo) ? { "@type": "ImageObject", url: clean(f.logo) } : undefined,
        description: clean(f.description),
        email:       clean(f.email),
        telephone:   clean(f.telephone),
        address:     clean(f.address) ? { "@type": "PostalAddress", streetAddress: clean(f.address) } : undefined,
        sameAs:      arr(f.sameAs),
        foundingDate: clean(f.foundingDate),
      };

    default:
      return base;
  }
}

/* Remove undefined keys deeply */
function stripUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(stripUndefined).filter(v => v !== undefined && v !== null && v !== "");
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k,v] of Object.entries(obj)) {
      const cleaned = stripUndefined(v);
      if (cleaned !== undefined && cleaned !== null && cleaned !== "" && !(Array.isArray(cleaned) && !cleaned.length)) {
        out[k] = cleaned;
      }
    }
    return out;
  }
  return obj;
}

/* ── Form Field Component ── */
function FormField({ field, value, onChange }) {
  const base = "sm-input";

  if (field.type === "select") {
    return (
      <div className="sm-field">
        <label className="sm-label">{field.label}{field.required && <span className="sm-req">*</span>}</label>
        <select className={`${base} sm-select`} value={value || ""} onChange={e => onChange(field.key, e.target.value)}>
          <option value="">— Select —</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="sm-field sm-field-full">
        <label className="sm-label">{field.label}{field.required && <span className="sm-req">*</span>}</label>
        <textarea
          className={`${base} sm-textarea`}
          value={value || ""}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="sm-field">
      <label className="sm-label">{field.label}{field.required && <span className="sm-req">*</span>}</label>
      <input
        className={base}
        type={field.type === "url" ? "text" : field.type}
        value={value || ""}
        onChange={e => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        spellCheck={false}
      />
    </div>
  );
}

/* ── Main Component ── */
export default function SchemaMarkup() {
  const [schemaType,  setSchemaType]  = useState("Article");
  const [fields,      setFields]      = useState({});
  const [faqItems,    setFaqItems]    = useState([{ q: "", a: "" }, { q: "", a: "" }]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: "Home", url: "https://example.com" }, { name: "", url: "" }]);
  const [result,      setResult]      = useState("");
  const [activeTab,   setActiveTab]   = useState("code");
  const [copied,      setCopied]      = useState(false);
  const [generated,   setGenerated]   = useState(false);

  const handleFieldChange = useCallback((key, val) => {
    setFields(prev => ({ ...prev, [key]: val }));
    setGenerated(false);
  }, []);

  const handleTypeChange = (type) => {
    setSchemaType(type);
    setFields({});
    setGenerated(false);
    setResult("");
  };

  const handleGenerate = () => {
    const raw    = buildSchema(schemaType, fields, faqItems, breadcrumbs);
    const clean  = stripUndefined(raw);
    const json   = JSON.stringify(clean, null, 2);
    const script = `<script type="application/ld+json">\n${json}\n</script>`;
    setResult(script);
    setGenerated(true);
    setActiveTab("code");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/html" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `schema-${schemaType.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    setFields({}); setResult(""); setGenerated(false);
    setFaqItems([{ q: "", a: "" }, { q: "", a: "" }]);
    setBreadcrumbs([{ name: "Home", url: "https://example.com" }, { name: "", url: "" }]);
  };

  const currentType = SCHEMA_TYPES.find(s => s.id === schemaType);
  const currentFields = FIELDS[schemaType] || [];

  /* Syntax highlight JSON */
  const highlightJSON = (code) => {
    return code
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = "sm-json-num";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "sm-json-key" : "sm-json-str";
        } else if (/true|false/.test(match)) {
          cls = "sm-json-bool";
        } else if (/null/.test(match)) {
          cls = "sm-json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      });
  };

  return (
    <>
      <Helmet>
        <title>Schema Markup Generator – Free JSON-LD Structured Data | ShauryaTools</title>
        <meta name="description" content="Generate valid JSON-LD schema markup for Article, Product, FAQ, LocalBusiness, Event, Recipe, and more. Free structured data generator for SEO." />
        <meta name="keywords" content="schema markup generator, json-ld generator, structured data, schema.org, seo schema, rich snippets, faq schema, product schema" />
        <link rel="canonical" href="https://shauryatools.vercel.app/schema-generator" />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content="https://shauryatools.vercel.app/schema-generator" />
        <meta property="og:title"       content="Schema Markup Generator – Free JSON-LD Structured Data | ShauryaTools" />
        <meta property="og:description" content="Generate valid JSON-LD schema markup for Article, Product, FAQ, LocalBusiness, Event, Recipe, and more. Free structured data generator for SEO." />
        <meta property="og:site_name"   content="ShauryaTools" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="Schema Markup Generator – Free JSON-LD Structured Data | ShauryaTools" />
        <meta name="twitter:description" content="Generate valid JSON-LD schema markup for Article, Product, FAQ, LocalBusiness, Event, Recipe, and more. Free." />
        <meta name="robots"   content="index, follow" />
        <meta name="author"   content="ShauryaTools" />
      </Helmet>

      <div className="sm-page">
        <div className="sm-inner">

          {/* ── Header ── */}
          <div className="sm-header">
            <div className="sm-icon"><IconSchema /></div>
            <div>
              <span className="sm-cat">SEO Tools</span>
              <h1>Schema Markup Generator</h1>
              <p>Generate valid JSON-LD structured data for rich Google search results.</p>
            </div>
          </div>

          {/* ── Type Selector ── */}
          <div className="sm-card">
            <label className="sm-section-label">Schema Type</label>
            <div className="sm-type-grid">
              {SCHEMA_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`sm-type-btn ${schemaType === t.id ? "sm-type-on" : ""}`}
                  onClick={() => handleTypeChange(t.id)}
                >
                  <span className="sm-type-emoji">{t.emoji}</span>
                  <span className="sm-type-label">{t.label}</span>
                  <span className="sm-type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Fields Card ── */}
          <div className="sm-card">
            <div className="sm-card-head">
              <div className="sm-card-title">
                <span>{currentType?.emoji}</span>
                <span>{currentType?.label} Details</span>
              </div>
              <button className="sm-btn-ghost sm-btn-sm" onClick={handleReset}>
                <IconRefresh /> Clear
              </button>
            </div>

            <div className="sm-divider" />

            {/* FAQ special UI */}
            {schemaType === "FAQ" && (
              <div className="sm-faq-list">
                {faqItems.map((item, i) => (
                  <div key={i} className="sm-faq-item">
                    <div className="sm-faq-num">Q{i + 1}</div>
                    <div className="sm-faq-fields">
                      <input
                        className="sm-input"
                        value={item.q}
                        onChange={e => {
                          const next = [...faqItems];
                          next[i] = { ...next[i], q: e.target.value };
                          setFaqItems(next); setGenerated(false);
                        }}
                        placeholder="Question text..."
                        spellCheck={false}
                      />
                      <textarea
                        className="sm-input sm-textarea"
                        value={item.a}
                        onChange={e => {
                          const next = [...faqItems];
                          next[i] = { ...next[i], a: e.target.value };
                          setFaqItems(next); setGenerated(false);
                        }}
                        placeholder="Answer text..."
                        rows={2}
                        spellCheck={false}
                      />
                    </div>
                    {faqItems.length > 1 && (
                      <button className="sm-del-btn" onClick={() => { setFaqItems(faqItems.filter((_,j) => j !== i)); setGenerated(false); }}>
                        <IconTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button className="sm-add-btn" onClick={() => setFaqItems([...faqItems, { q: "", a: "" }])}>
                  <IconPlus /> Add Question
                </button>
              </div>
            )}

            {/* Breadcrumbs special UI */}
            {schemaType === "BreadcrumbList" && (
              <div className="sm-bc-list">
                {breadcrumbs.map((item, i) => (
                  <div key={i} className="sm-bc-item">
                    <div className="sm-bc-pos">{i + 1}</div>
                    <input
                      className="sm-input"
                      value={item.name}
                      onChange={e => { const n=[...breadcrumbs]; n[i]={...n[i],name:e.target.value}; setBreadcrumbs(n); setGenerated(false); }}
                      placeholder="Page name"
                    />
                    <input
                      className="sm-input"
                      value={item.url}
                      onChange={e => { const n=[...breadcrumbs]; n[i]={...n[i],url:e.target.value}; setBreadcrumbs(n); setGenerated(false); }}
                      placeholder="https://example.com/page"
                    />
                    {breadcrumbs.length > 1 && (
                      <button className="sm-del-btn" onClick={() => { setBreadcrumbs(breadcrumbs.filter((_,j)=>j!==i)); setGenerated(false); }}>
                        <IconTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button className="sm-add-btn" onClick={() => setBreadcrumbs([...breadcrumbs, { name: "", url: "" }])}>
                  <IconPlus /> Add Crumb
                </button>
              </div>
            )}

            {/* Standard fields grid */}
            {schemaType !== "FAQ" && schemaType !== "BreadcrumbList" && (
              <div className="sm-fields-grid">
                {currentFields.map(field => (
                  <FormField
                    key={field.key}
                    field={field}
                    value={fields[field.key] || ""}
                    onChange={handleFieldChange}
                  />
                ))}
              </div>
            )}

            <div className="sm-divider" />

            {/* Generate action */}
            <div className="sm-gen-row">
              <span className="sm-hint">
                Generates a <code>&lt;script type="application/ld+json"&gt;</code> tag ready to paste into your HTML <code>&lt;head&gt;</code>.
              </span>
              <button className="sm-generate-btn" onClick={handleGenerate}>
                <IconZap /> Generate Schema
              </button>
            </div>
          </div>

          {/* ── Result ── */}
          {result && (
            <div className="sm-card animate-in">

              <div className="sm-result-top">
                <div className="sm-result-meta">
                  <span className="sm-result-badge">✓ Valid JSON-LD</span>
                  <span className="sm-result-type">{currentType?.emoji} {currentType?.label}</span>
                  <span className="sm-result-size">{result.length.toLocaleString()} bytes</span>
                </div>
                <div className="sm-result-actions">
                  <div className="sm-tabs">
                    <button className={`sm-tab ${activeTab==="code"?"sm-tab-on":""}`} onClick={()=>setActiveTab("code")}>Script Tag</button>
                    <button className={`sm-tab ${activeTab==="json"?"sm-tab-on":""}`} onClick={()=>setActiveTab("json")}>JSON Only</button>
                  </div>
                  <button className="sm-btn-ghost sm-btn-sm" onClick={handleDownload}><IconDownload /> .html</button>
                  <button className={`sm-copy-btn ${copied?"sm-copied":""}`} onClick={handleCopy}>
                    {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                  </button>
                </div>
              </div>

              <div
                className="sm-code-block"
                dangerouslySetInnerHTML={{
                  __html: highlightJSON(
                    activeTab === "json"
                      ? JSON.stringify(stripUndefined(buildSchema(schemaType, fields, faqItems, breadcrumbs)), null, 2)
                      : result
                  )
                }}
              />

              <div className="sm-result-footer">
                <div className="sm-usage-tip">
                  <strong>💡 How to use:</strong> Paste this inside the <code>&lt;head&gt;</code> of your HTML page. Test with <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">Google's Rich Results Test</a>.
                </div>
                <button className={`sm-copy-full ${copied?"sm-copied":""}`} onClick={handleCopy}>
                  {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Schema</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}