import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// ✅ All 30 pages lazy loaded — each page only loads when visited
const Home                    = lazy(() => import("./Home"));
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
const LandingPageGenerator              = lazy(() => import("./pages/LandingPageGen"));
const HomeworkHelper              = lazy(() => import("./pages/HomeworkHelper"));
const NotesSimplifier              = lazy(() => import("./pages/NotesSimplifier"));
const EmailReplyGenerator              = lazy(() => import("./pages/EmailReplyGenerator"));
const EmailGenerator              = lazy(() => import("./pages/EmailGenerator"));
const WhatsAppRewriter              = lazy(() => import("./pages/WhatsAppRewriter"));
const WhatsAppScreenGenerator             = lazy(() => import("./pages/WhatsAppScreenshot"));
const ExcuseGenerator             = lazy(() => import("./pages/ExcuseGenerator"));
const DailyPlannerGenerator            = lazy(() => import("./pages/DailyPlannerGenerator"));
const DietPlanGenerator            = lazy(() => import("./pages/DietPlanGenerator"));
const ExpenseSplitCalculator            = lazy(() => import("./pages/ExpenseSplitCalculator"));
const StudyTimeCalculator            = lazy(() => import("./pages/StudyTimeCalculator"));
const HabitTracker          = lazy(() => import("./pages/HabitTrackerGenerator"));
const DailyAffirmationGenerator          = lazy(() => import("./pages/DailyAffirmationGenerator"));
const RelationshipCompatibilityChecker          = lazy(() => import("./pages/RelationshipCompatibilityChecker"));
const BusinessNameGenerator          = lazy(() => import("./pages/BusinessNameGenerator"));
const SpeechScriptGenerator          = lazy(() => import("./pages/SpeechScriptGenerator"));
const StoryGenerator          = lazy(() => import("./pages/StoryGenerator"));
const ColdEmailGenerator          = lazy(() => import("./pages/ColdEmailGenerator"));
const ColdWhatsAppGenerator          = lazy(() => import("./pages/WhatsAppGenerator"));
const StartupValidator          = lazy(() => import("./pages/StartupValidator"));
const GroceryListGenerator          = lazy(() => import("./pages/GroceryListGenerator"));
const WaterIntakeCalculator          = lazy(() => import("./pages/WaterIntakeCalculator"));
const ScreenTimePlanner          = lazy(() => import("./pages/ScreenTimePlanner"));
const InterviewGenerator          = lazy(() => import("./pages/InterviewGenerator"));
const SelfIntroGenerator          = lazy(() => import("./pages/SelfIntroGenerator"));
const ProductComparison          = lazy(() => import("./pages/ProductComparison"));
const MCQGenerator          = lazy(() => import("./pages/MCQGenerator"));
const JournalPromptGen          = lazy(() => import("./pages/JournalPromptGen"));
const ProductivityBooster          = lazy(() => import("./pages/ProductivityBooster"));
const PomodoroTimer          = lazy(() => import("./pages/PomodoroTimer"));
const ExamCountdown          = lazy(() => import("./pages/ExamCountdown"));
const FlipClock          = lazy(() => import("./pages/FlipClock"));
const FlashcardGenerator          = lazy(() => import("./pages/FlashcardGenerator"));
const StudyStreakTracker          = lazy(() => import("./pages/StudyStreakTracker"));
const PercentageCalculator          = lazy(() => import("./pages/PercentageCalculator"));
const GSTCalculator          = lazy(() => import("./pages/GSTCalculator"));
const SIPCalculator          = lazy(() => import("./pages/SIPCalculator"));
const IncomeTaxCalculator         = lazy(() => import("./pages/IncomeTaxCalculator"));
const FuelCalculator         = lazy(() => import("./pages/FuelCalculator"));
const BudgetPlanner         = lazy(() => import("./pages/BudgetPlanner"));
const SavingsGoalCalculator         = lazy(() => import("./pages/SavingsGoalCalculator"));
const CreditCardEMICalculator         = lazy(() => import("./pages/CreditCardEMICalculator"));
const ElectricityBillEstimator         = lazy(() => import("./pages/ElectricityBillEstimator"));


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
          <Route path="/landing-page-generator"   element={<LandingPageGenerator />} />
          <Route path="/homework-helper-ai"   element={<HomeworkHelper />} />
          <Route path="/notes-simplifier"   element={<NotesSimplifier />} />
          <Route path="/ai-email-reply-generator"   element={<EmailReplyGenerator />} />
          <Route path="/email-generator"   element={<EmailGenerator />} />
          <Route path="/whatsapp-rewriter"   element={<WhatsAppRewriter />} />
          <Route path="/whatsapp-screenshot-generator"   element={<WhatsAppScreenGenerator />} />
          <Route path="/excuse-generator"   element={<ExcuseGenerator />} />
          <Route path="/daily-planner-generator"   element={<DailyPlannerGenerator />} />
          <Route path="/diet-plan-generator"   element={<DietPlanGenerator />} />
          <Route path="/expense-split-calculator"   element={<ExpenseSplitCalculator />} />
          <Route path="/study-time-calculator"   element={<StudyTimeCalculator />} />
          <Route path="/habit-tracker-generator"   element={<HabitTracker />} />
          <Route path="/daily-affirmation-generator"   element={<DailyAffirmationGenerator />} />
          <Route path="/relationship-compatibility-checker"   element={<RelationshipCompatibilityChecker/>} />
          <Route path="/business-name-generator"   element={<BusinessNameGenerator/>} />
          <Route path="/speech-script-generator"   element={<SpeechScriptGenerator/>} />
          <Route path="/story-generator"   element={<StoryGenerator/>} />
          <Route path="/cold-email-generator"   element={<ColdEmailGenerator/>} />
          <Route path="/whatsapp-generator"   element={<ColdWhatsAppGenerator/>} />
          <Route path="/startup-validator"   element={<StartupValidator/>} />
          <Route path="/grocery-list-generator"   element={<GroceryListGenerator/>} />
          <Route path="/water-intake-calculator"   element={<WaterIntakeCalculator/>} />
          <Route path="/screen-time-planner"   element={<ScreenTimePlanner/>} />
          <Route path="/interview-generator"   element={<InterviewGenerator/>} />
          <Route path="/self-intro-generator"   element={<SelfIntroGenerator/>} />
          <Route path="/product-comparison"   element={<ProductComparison/>} />
          <Route path="/study-notes-mcq-generator"   element={<MCQGenerator/>} />
          <Route path="/ai-journal-prompt-generator"   element={<JournalPromptGen/>} />
          <Route path="/productivity-booster-plan"   element={<ProductivityBooster/>} />
          <Route path="/pomodoro-timer"   element={<PomodoroTimer/>} />
          <Route path="/exam-countdown"   element={<ExamCountdown/>} />
          <Route path="/flip-clock"   element={<FlipClock/>} />
          <Route path="/flashcard-generator"   element={<FlashcardGenerator/>} />
          <Route path="/study-streak-tracker"   element={<StudyStreakTracker/>} />
          <Route path="/marks-percentage-calculator"   element={<PercentageCalculator/>} />
          <Route path="/gst-calculator"   element={<GSTCalculator/>} />
          <Route path="/sip-calculator"   element={<SIPCalculator/>} />
          <Route path="/income-tax-calculator-india"   element={<IncomeTaxCalculator/>} />
          <Route path="/fuel-expense-calculator"   element={<FuelCalculator/>} />
          <Route path="/budget-planner"   element={<BudgetPlanner/>} />
          <Route path="/savings-goal-calculator"   element={<SavingsGoalCalculator/>} />
          <Route path="/credit-card-emi-calculator"   element={<CreditCardEMICalculator/>} />
          <Route path="/electricity-bill-estimator"   element={<ElectricityBillEstimator/>} />
          


          {/* ✅ 404 — always last */}
          <Route path="*"                               element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;