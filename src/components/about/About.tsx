import { contact } from "../../data/contact";
import "./About.css";

export default function About() {
  return (
    <section id="about" className="about section">
      <div className="section-inner">
        <h2 className="section-title">
          About <span className="gradient-text">Me</span>
        </h2>
        <div className="about-grid">
          <div className="about-bio">
            <p>{contact.about}</p>
            <div className="about-details">
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span>{contact.location}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            </div>
            <a
              href="/resume.pdf"
              download
              className="about-resume-btn"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M7 9l-3-3M7 9l3-3M1 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download Resume
            </a>
          </div>
          <div className="about-skills">
            <h3 className="skills-heading">Tech Stack</h3>
            <div className="skills-grid">
              {contact.skills.map((skill) => (
                <div key={skill} className="skill-chip">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
