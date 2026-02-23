import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Instagram, Github } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`nb-root ${scrolled ? "nb-scrolled" : ""}`}>
      <div className="nb-shell">
        <div className="nb-inner">

          {/* ── Logo ── */}
          <Link to="/" className="nb-logo">
            <img src="/logo.png" alt="ShauryaTools" className="nb-logo-img" />
            <span className="nb-wordmark">
              Shaurya<strong>Tools</strong>
            </span>
          </Link>

          {/* ── Right cluster ── */}
          <div className="nb-right">

            {/* Back to all tools (non-home pages) */}
            {!isHome && (
              <Link to="/" className="nb-back">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                <span>All Tools</span>
              </Link>
            )}

            <div className="nb-divider" />

            {/* Instagram */}
            <a
              href="https://instagram.com/aniket_jamunde_002"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-icon"
              aria-label="Instagram"
              title="Instagram"
            >
              <Instagram size={17} strokeWidth={2} />
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/Aniketjamunde9146"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-icon"
              aria-label="GitHub"
              title="GitHub"
            >
              <Github size={17} strokeWidth={2} />
            </a>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;