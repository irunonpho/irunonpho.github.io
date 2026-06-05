import { contact } from "../../data/contact";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-content">
        <p className="hero-greeting">Hello, I'm</p>
        <h1 className="hero-name">
          {contact.name.split("").map((ch, i) => (
            <span key={i} className="hero-letter" style={{ animationDelay: `${i * 0.05}s` }}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h1>
        <p className="hero-title">{contact.title}</p>
        <p className="hero-tagline">{contact.tagline}</p>
        <div className="hero-cta">
          <a href="#contact" className="btn-primary">Get in Touch</a>
          <a href="#about" className="btn-secondary">Learn More</a>
        </div>
      </div>
      <div className="hero-scroll-hint">
        <span />
      </div>
    </section>
  );
}
