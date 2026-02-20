import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// ✅ All 30 pages lazy loaded — each page only loads when visited
const Home                    = lazy(() => import("./pages/Home"));
const Hashtag                 = lazy(() => import("./pages/Hashtag"));
const Prompt                  = lazy(() => import("./pages/Prompt"));
const ReadmeGenerator         = lazy(() => import("./pages/ReadmeGenerator"));
const JsonFormatter           = lazy(() => import("./pages/JsonFormator"));
const JsonYamlConverter       = lazy(() => import("./pages/JsonYamlconverter"));
const Base64Converter         = lazy(() => import("./pages/Base64Converter"));
const UrlEncoderDecoder       = lazy(() => import("./pages/Urlencoderdecoder"));
const CodeMinifier            = lazy(() => import("./pages/CodeMinifier"));
const MarkdownPreviewer       = lazy(() => import("./pages/MarkdownPreviewer"));
const RegexTester             = lazy(() => import("./pages/RegexTester"));
const UUIDGenerator           = lazy(() => import("./pages/Uuidgenerator"));
const GitignoreGenerator      = lazy(() => import("./pages/GitignoreGenerator"));
const LicenseGenerator        = lazy(() => import("./pages/LicenseGenerator"));
const MetaTagGenerator        = lazy(() => import("./pages/MetaTagGenerator"));
const ProfileReadmeGenerator  = lazy(() => import("./pages/ProfileReadmeGenerator"));
const InstagramBioGenerator   = lazy(() => import("./pages/InstagramBioGenerator"));
const YouTubeDescGenerator    = lazy(() => import("./pages/YouTubeDescriptionGenerator"));
const LinkedInPostGenerator   = lazy(() => import("./pages/LinkdenPostGenerator"));
const CaptionGenerator        = lazy(() => import("./pages/CaptionGenerator"));
const EmojiCombiner           = lazy(() => import("./pages/EmojiCombiner"));
const YouTubeTitleOptimizer   = lazy(() => import("./pages/YoutubeTitleOptimizer"));
const PasswordGenerator       = lazy(() => import("./pages/PasswordGenerator"));
const QRCodeGenerator         = lazy(() => import("./pages/QrCodeGenerator"));
const UnitConverter           = lazy(() => import("./pages/UnitConverter"));
const BMICalculator           = lazy(() => import("./pages/BmiCalculator"));
const LoanEMICalculator       = lazy(() => import("./pages/LoanEMICalculator"));
const AgeCalculator           = lazy(() => import("./pages/AgeCalculator"));
const TextTools               = lazy(() => import("./pages/TextTools"));
const ColorPicker             = lazy(() => import("./pages/ColorPicker"));
const CodePrettifier          = lazy(() => import("./pages/CodePrettifier"));
const ApnaStartup          = lazy(() => import("./pages/ApnaStartup"));
const BlogPostGenerator          = lazy(() => import("./pages/BlogPostGenerator"));
const ProductDescriptionGenerator          = lazy(() => import("./pages/ProductDescriptionGenerator"));
const ResumeGenerator          = lazy(() => import("./pages/ResumeBuilder"));
const CoverLetterGenerator          = lazy(() => import("./pages/CoverLetterGenerator"));
const CodeExplainer          = lazy(() => import("./pages/CodeExplainer"));
const CodeToDoc              = lazy(() => import("./pages/CodeToDoc"));
const ErrorDebugger              = lazy(() => import("./pages/ErrorDebugger"));
const SitemapGenerator              = lazy(() => import("./pages/SitemapGenerator"));
const KeywordDensityChecker              = lazy(() => import("./pages/KeywordDensityChecker"));
const SchemaMarkupGenerator              = lazy(() => import("./pages/SchemaMarkupGenerator"));
const PageSpeedAnalyzer              = lazy(() => import("./pages/PageSpeedAnalyzer"));

// ✅ 404 page
function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
      <p style={{ color: "#888" }}>Page not found.</p>
      <a href="/" style={{ color: "#6c47ff" }}>← Back to Home</a>
    </div>
  );
}

// ✅ Spinner shown while a page chunk is being fetched
function PageLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div style={{
        width: 36, height: 36,
        border: "3px solid #e5e7eb",
        borderTop: "3px solid #6c47ff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />

      {/* ✅ Suspense wraps all routes — shows spinner while any page loads */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                               element={<Home />} />
          <Route path="/hashtag-generator"              element={<Hashtag />} />
          <Route path="/prompt-generator"               element={<Prompt />} />
          <Route path="/readme-generator"               element={<ReadmeGenerator />} />
          <Route path="/json-formatter"                 element={<JsonFormatter />} />
          <Route path="/json-to-yaml"                   element={<JsonYamlConverter />} />
          <Route path="/base64"                         element={<Base64Converter />} />
          <Route path="/url-encoder"                    element={<UrlEncoderDecoder />} />
          <Route path="/code-minifier"                  element={<CodeMinifier />} />
          <Route path="/markdown-previewer"             element={<MarkdownPreviewer />} />
          <Route path="/regex-tester"                   element={<RegexTester />} />
          <Route path="/uuid-generator"                 element={<UUIDGenerator />} />
          <Route path="/gitignore-generator"            element={<GitignoreGenerator />} />
          <Route path="/license-generator"              element={<LicenseGenerator />} />
          <Route path="/metatag-generator"              element={<MetaTagGenerator />} />
          <Route path="/profile-readme-generator"       element={<ProfileReadmeGenerator />} />
          <Route path="/instagram-bio-generator"        element={<InstagramBioGenerator />} />
          <Route path="/youtube-description-generator"  element={<YouTubeDescGenerator />} />
          <Route path="/linkedin-post-generator"        element={<LinkedInPostGenerator />} />
          <Route path="/social-media-caption-generator" element={<CaptionGenerator />} />
          <Route path="/emoji-combiner"                 element={<EmojiCombiner />} />
          <Route path="/youtube-title-optimizer"        element={<YouTubeTitleOptimizer />} />
          <Route path="/password-generator"             element={<PasswordGenerator />} />
          <Route path="/qr-code-generator"              element={<QRCodeGenerator />} />
          <Route path="/unit-converter"                 element={<UnitConverter />} />
          <Route path="/bmi-calculator"                 element={<BMICalculator />} />
          <Route path="/loan-emi-calculator"            element={<LoanEMICalculator />} />
          <Route path="/age-calculator"                 element={<AgeCalculator />} />
          <Route path="/text-tools"                     element={<TextTools />} />
          <Route path="/color-picker"                   element={<ColorPicker />} />
          <Route path="/code-prettifier"                element={<CodePrettifier />} />
          <Route path="/apna-startup"                   element={<ApnaStartup />} />
          <Route path="/blog-post-generator"            element={<BlogPostGenerator />} />
          <Route path="/product-description-generator"  element={<ProductDescriptionGenerator />} />
          <Route path="/resume-builder"                 element={<ResumeGenerator />} />
          <Route path="/cover-letter-generator"         element={<CoverLetterGenerator />} />
          <Route path="/code-explainer"         element={<CodeExplainer />} />
          <Route path="/code-to-document"         element={<CodeToDoc />} />
          <Route path="/error-debugger"         element={<ErrorDebugger />} />
          <Route path="/sitemap-generator"         element={<SitemapGenerator />} />
          <Route path="/keyword-density-checker"   element={<KeywordDensityChecker />} />
          <Route path="/schema-markup-generator"   element={<SchemaMarkupGenerator />} />
          <Route path="/page-speed-analyzer"   element={<PageSpeedAnalyzer />} />

        


          



          {/* ✅ 404 — always last */}
          <Route path="*"                               element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;