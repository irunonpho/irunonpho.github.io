import { useState, useEffect, useCallback, useRef } from "react";
import { portfolio } from "../data/portfolio";
import "./Portfolio.css";

export default function Portfolio() {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const total = portfolio.length;

  const go = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => go(current + 1), [current, go]);  // eslint-disable-line react-hooks/exhaustive-deps
  const prev = useCallback(() => go(current - 1), [current, go]);

  // Auto-advance
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { next(); }
      if (e.key === "ArrowLeft")  { prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <section id="portfolio" className="portfolio section">
      <div className="section-inner">
        <h2 className="section-title">
          My <span className="gradient-text">Work</span>
        </h2>

        <div className="portfolio-carousel">
          {/* Prev arrow */}
          <button
            className="portfolio-arrow portfolio-arrow--prev"
            onClick={() => { prev(); startTimer(); }}
            aria-label="Previous project"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Slide stage */}
          <div className="portfolio-stage" ref={stageRef}>
            {portfolio.map((slide, i) => (
              <div
                key={i}
                className={`portfolio-slide ${i === current ? "active" : ""}`}
                aria-hidden={i !== current}
              >
                {slide.image && !imgErrors[i] ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="portfolio-slide-img"
                    onError={() => setImgErrors((e) => ({ ...e, [i]: true }))}
                  />
                ) : (
                  <div
                    className="portfolio-slide-placeholder"
                    style={{ background: slide.placeholder }}
                  />
                )}
                <div className="portfolio-slide-overlay">
                  <div className="portfolio-slide-info">
                    <h3 className="portfolio-slide-title">{slide.title}</h3>
                    <p className="portfolio-slide-desc">{slide.description}</p>
                    <div className="portfolio-slide-tags">
                      {slide.tags.map((t) => (
                        <span key={t} className="portfolio-tag">{t}</span>
                      ))}
                    </div>
                    {slide.link && (
                      <a href={slide.link} target="_blank" rel="noreferrer" className="portfolio-slide-link">
                        View Project →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next arrow */}
          <button
            className="portfolio-arrow portfolio-arrow--next"
            onClick={() => { next(); startTimer(); }}
            aria-label="Next project"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="portfolio-dots" role="tablist">
          {portfolio.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}`}
              className={`portfolio-dot ${i === current ? "active" : ""}`}
              onClick={() => { go(i); startTimer(); }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
