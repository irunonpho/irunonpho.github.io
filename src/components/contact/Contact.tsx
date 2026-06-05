import type { ReactElement } from "react";
import { useState } from "react";
import { contact } from "../../data/contact";
import "./Contact.css";

// Sign up at https://formspree.io and replace with your form ID
const FORMSPREE_ID = "meewoqpd";

const icons: Record<string, ReactElement> = {
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
};

export default function Contact() {
  const [fields, setFields] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(fields),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="contact section">
      <div className="section-inner contact-inner">
        <h2 className="section-title">
          Let's <span className="gradient-text">Connect</span>
        </h2>
        <p className="contact-subtext">
          Open to Staff engineering roles in AI infrastructure or challenging problems. Let's talk.
        </p>

        <a href={`mailto:${contact.email}`} className="contact-email-link">
          {contact.email}
        </a>

        <div className="social-row">
          {contact.social.map((s) => (
            <a
              key={s.platform}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="social-btn"
              aria-label={s.platform}
            >
              {icons[s.icon]}
              <span>{s.platform}</span>
            </a>
          ))}
        </div>

        {status === "sent" ? (
          <div className="contact-form-success">
            <p>Thanks for reaching out — I'll get back to you soon!</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="cf-name">Name</label>
                <input
                  id="cf-name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  required
                  value={fields.name}
                  onChange={handleChange}
                />
              </div>
              <div className="contact-field">
                <label htmlFor="cf-email">Email</label>
                <input
                  id="cf-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={fields.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="contact-field">
              <label htmlFor="cf-message">Message</label>
              <textarea
                id="cf-message"
                name="message"
                rows={5}
                placeholder="Tell me about your project or opportunity..."
                required
                value={fields.message}
                onChange={handleChange}
              />
            </div>
            {status === "error" && (
              <p className="contact-form-error">Something went wrong — please try again.</p>
            )}
            <button type="submit" className="btn-primary contact-submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}

        <div className="contact-footer">
          <span>
            {contact.name} &mdash; {contact.location}
          </span>
        </div>
      </div>
    </section>
  );
}
