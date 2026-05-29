import { contact } from "../data/contact";
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
              {contact.phone && (
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>
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
