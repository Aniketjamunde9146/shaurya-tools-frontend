import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Instagram, Github } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        .nav-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 999;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* Floating pill container */
        .nav-pill {
          margin: 14px auto 0;
          max-width: 860px;
          padding: 0 20px;
        }

        .nav-inner {
          height: 56px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(40px) saturate(200%) brightness(110%);
          -webkit-backdrop-filter: blur(40px) saturate(200%) brightness(110%);
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow:
            0 2px 8px rgba(0,0,0,0.04),
            0 0 0 0.5px rgba(0,0,0,0.06),
            inset 0 1px 0 rgba(255,255,255,0.9);
          transition: background 0.4s ease, box-shadow 0.4s ease;
        }

        .nav-root.scrolled .nav-inner {
          background: rgba(255, 255, 255, 0.72);
          box-shadow:
            0 8px 32px rgba(0,0,0,0.09),
            0 0 0 0.5px rgba(0,0,0,0.07),
            inset 0 1px 0 rgba(255,255,255,1);
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
        }

        .nav-logo-img {
          width: 56px;
          height: 56px;
          border-radius: 9px;
          object-fit: contain;
      
          padding: 3px;
          transition: transform 0.25s ease;
        }

        .nav-logo:hover .nav-logo-img {
          transform: scale(1.07);
        }

        .nav-wordmark {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
        }

        .nav-wordmark b {
          font-weight: 800;
          color: #16a34a;
        }

        /* Right cluster */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Separator */
        .nav-sep {
          width: 1px;
          height: 18px;
          background: rgba(0,0,0,0.1);
          margin: 0 4px;
        }

        /* Back link */
        .nav-back {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          padding: 6px 13px;
          border-radius: 10px;
          letter-spacing: -0.01em;
          transition: background 0.18s ease, color 0.18s ease;
        }

        .nav-back:hover {
          background: rgba(0,0,0,0.05);
          color: #0f172a;
        }

        .nav-back svg {
          opacity: 0.5;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .nav-back:hover svg {
          transform: translateX(-2px);
          opacity: 1;
        }

        /* Icon buttons */
        .nav-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #000000;
          text-decoration: none;
          background: transparent;
          transition: background 0.18s ease, color 0.18s ease, transform 0.2s ease;
        }

        .nav-icon:hover {
          background: rgba(0,0,0,0.06);
          color: #0f172a;
          transform: translateY(-1px);
        }

        /* Mobile */
        @media (max-width: 600px) {
          .nav-pill { padding: 0 12px; }
          .nav-inner { padding: 0 14px; border-radius: 14px; height: 50px; }
          .nav-wordmark { display: none; }
          .nav-back span { display: none; }
          .nav-back { padding: 6px 8px; }
          .nav-sep { display: none; }
        }
      `}</style>

      <nav className={`nav-root${scrolled ? " scrolled" : ""}`}>
        <div className="nav-pill">
          <div className="nav-inner">

            {/* Logo */}
            <Link to="/" className="nav-logo">
              <img src="/logo.png" alt="Shaurya Tools" className="nav-logo-img" />
              <span className="nav-wordmark">Free<b>Tools</b></span>
            </Link>

            {/* Right */}
            <div className="nav-right">

              {!isHomePage && (
                <>
                  <Link to="/" className="nav-back">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                    <span>All Tools</span>
                  </Link>
                  <div className="nav-sep" />
                </>
              )}

              <a
                href="https://instagram.com/aniket_jamunde_002"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-icon"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>

              <a
                href="https://github.com/Aniketjamunde9146"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-icon"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>

            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;