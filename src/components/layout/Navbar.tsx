import { useEffect, useRef, useState } from "react";
import { contact } from "../../data/contact";
import "./Navbar.css";

const linksBefore = [
  { label: "About", href: "#about"     },
  { label: "Work",  href: "#portfolio" },
];

const linksAfter = [
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [labOpen,    setLabOpen]    = useState(false);
  const [c4SubOpen,  setC4SubOpen]  = useState(false);

  const labTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const c4Timer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const openLab  = () => { clearTimeout(labTimer.current); setLabOpen(true);   };
  const closeLab = () => { labTimer.current  = setTimeout(() => { setLabOpen(false); setC4SubOpen(false); }, 150); };

  const openC4   = () => { clearTimeout(c4Timer.current);  clearTimeout(labTimer.current); setC4SubOpen(true);  setLabOpen(true); };
  const closeC4  = () => { c4Timer.current   = setTimeout(() => setC4SubOpen(false), 150); };

  const closeAll = () => { setLabOpen(false); setC4SubOpen(false); };

  // Scroll to the lab section then set the hash (so hashchange fires for tab switching)
  const navToLab = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" });
    window.location.hash = hash;
    closeAll();
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <a href="#" className="navbar-logo">
        {contact.name.split(" ").map((w) => w[0]).join("")}
      </a>
      <ul className="navbar-links">
        {linksBefore.map((l) => (
          <li key={l.label}><a href={l.href}>{l.label}</a></li>
        ))}

        {/* Lab dropdown */}
        <li
          className={`navbar-dropdown${labOpen ? " open" : ""}`}
          onMouseEnter={openLab}
          onMouseLeave={closeLab}
        >
          <a href="#lab" className="navbar-dropdown-trigger">
            Lab <span className="navbar-caret">▾</span>
          </a>

          <ul className="navbar-dropdown-menu" onMouseEnter={openLab} onMouseLeave={closeLab}>
            {/* Game of Life — plain item */}
            <li>
              <a href="#lab-gol" onClick={e => navToLab(e, "lab-gol")}>Game of Life</a>
            </li>

            {/* Connect Four — item with flyout */}
            <li
              className={`navbar-has-submenu${c4SubOpen ? " open" : ""}`}
              onMouseEnter={openC4}
              onMouseLeave={closeC4}
            >
              <a href="#lab-c4" onClick={closeAll}>
                Connect Four
                <span className="navbar-sub-caret">›</span>
              </a>

              <ul className="navbar-submenu" onMouseEnter={openC4} onMouseLeave={closeC4}>
                <li>
                  <a href="#lab-c4" onClick={e => navToLab(e, "lab-c4")}>vs Human</a>
                </li>
                <li>
                  <a href="#lab-c4-ai" onClick={e => navToLab(e, "lab-c4-ai")}>vs AI</a>
                </li>
              </ul>
            </li>

            {/* Snake — plain item */}
            <li>
              <a href="#lab-snake" onClick={e => navToLab(e, "lab-snake")}>Snake</a>
            </li>

            {/* Boop — plain item */}
            <li>
              <a href="#lab-boop" onClick={e => navToLab(e, "lab-boop")}>Boop</a>
            </li>
          </ul>
        </li>

        {linksAfter.map((l) => (
          <li key={l.label}><a href={l.href}>{l.label}</a></li>
        ))}
      </ul>
    </nav>
  );
}
