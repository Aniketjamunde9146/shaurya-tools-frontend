import { ExternalLink } from "lucide-react";
import "./SiteFooter.css";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span className="site-footer-brand">ShauryaTools</span>
        <span aria-hidden="true">·</span>
        <span>Free tools for useful work</span>
        <span aria-hidden="true">·</span>
        <a href="https://aniketwebdev.in" target="_blank" rel="noopener noreferrer">
          Managed by aniketwebdev.in <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
