import { useLocation } from "react-router-dom";
import { tools } from "../data/toolsData";
import "./ToolSEOContent.css";

const categoryGuidance = {
  Utilities: "It is designed for quick, practical tasks that people commonly need at work, at home, or while managing digital files.",
  Development: "It helps developers move from an input to a clean, usable result without installing another desktop utility.",
  "AI Tools": "It gives creators and professionals a structured starting point so they can spend more time reviewing the result and less time repeating routine work.",
  Design: "It helps prepare visual assets for websites, documents, social posts, and other digital projects.",
  Finance: "It turns the information you provide into a clear estimate that can support planning and comparison.",
  Education: "It is built for learning and organization, with results that are easier to review, edit, and apply.",
};

function buildContent(tool) {
  const guidance = categoryGuidance[tool.category] || "It is built to provide a focused result with a simple browser-based workflow.";
  return {
    intro: `${tool.name} is a free online tool from Shaurya Tools. ${tool.description} The tool runs in your browser and is designed to keep the workflow direct, understandable, and useful on both desktop and mobile devices.`,
    how: `To use ${tool.name}, open the tool, provide the information requested by the form or editor, and review the result before using or downloading it. The interface keeps the important controls close to the result, so you can make adjustments without moving between different services. ${guidance}`,
    value: `This tool is useful when you need a quick answer, a reusable file, or a practical first draft without creating an account. Shaurya Tools focuses on small, single-purpose utilities that reduce friction for developers, creators, students, and everyday users. Check the output before publishing, submitting, or relying on it for an important decision.`,
  };
}

export default function ToolSEOContent() {
  const { pathname } = useLocation();
  const tool = tools.find(item => `/${item.slug}` === pathname);

  if (!tool) return null;

  const content = buildContent(tool);
  const faq = [
    {
      question: `What is ${tool.name}?`,
      answer: content.intro,
    },
    {
      question: `How do I use the ${tool.name}?`,
      answer: content.how,
    },
  ];

  return (
    <section className="tool-seo-content" aria-labelledby="tool-seo-heading">
      <div className="tool-seo-inner">
        <p className="tool-seo-eyebrow">About this tool</p>
        <h2 id="tool-seo-heading">{tool.name}: free online guide</h2>
        <p>{content.intro}</p>

        <div className="tool-seo-grid">
          <div>
            <h3>How {tool.name} works</h3>
            <p>{content.how}</p>
          </div>
          <div>
            <h3>Who can use it?</h3>
            <p>{content.value}</p>
          </div>
        </div>

        <div className="tool-seo-faq">
          <h3>Frequently asked questions</h3>
          {faq.map(item => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
