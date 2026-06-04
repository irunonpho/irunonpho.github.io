import { useEffect, useState } from "react";
import { contact } from "../data/contact";
import "./Navbar.css";

const links = [
  { label: "About",   href: "#about"     },
  { label: "Work",    href: "#portfolio" },
  { label: "Lab",     href: "#lab"       },
  { label: "Contact", href: "#contact"   },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <a href="#" className="navbar-logo">
        {contact.name.split(" ").map((w) => w[0]).join("")}
      </a>
      <ul className="navbar-links">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
