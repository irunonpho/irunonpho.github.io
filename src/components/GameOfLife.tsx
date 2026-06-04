import { useState, useEffect, useCallback, useRef } from "react";
import ConnectFour from "./ConnectFour";
import "./GameOfLife.css";

const ROWS = 20;
const COLS = 20;

type Grid = boolean[][];

const makeEmpty = (): Grid =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(false));

const makeRandom = (): Grid =>
  Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Math.random() > 0.62)
  );

function nextGen(grid: Grid): Grid {
  return grid.map((row, r) =>
    row.map((alive, c) => {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc]) n++;
        }
      return alive ? n === 2 || n === 3 : n === 3;
    })
  );
}

export default function GameOfLife() {
  const [activeGame, setActiveGame] = useState<"gol" | "c4">(() =>
    window.location.hash === "#lab-c4" ? "c4"
    : window.location.hash === "#lab-gol" ? "gol"
    : "gol"
  );
  const [grid, setGrid] = useState<Grid>(makeEmpty);
  const [running, setRunning] = useState(false);
  const [gen, setGen] = useState(0);
  const [tickMs, setTickMs] = useState(180);
  const runningRef = useRef(false);
  runningRef.current = running;

  // Switch tab when navigating via the navbar dropdown
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#lab-c4") {
        setActiveGame("c4");
        setRunning(false);
      } else if (window.location.hash === "#lab-gol") {
        setActiveGame("gol");
        setRunning(false);
      }
      // plain #lab just scrolls — no tab change
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const advance = useCallback(() => {
    setGrid(g => nextGen(g));
    setGen(n => n + 1);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(advance, tickMs);
    return () => clearInterval(id);
  }, [running, advance, tickMs]);

  const toggle = (r: number, c: number) =>
    setGrid(g => g.map((row, ri) =>
      row.map((cell, ci) => ri === r && ci === c ? !cell : cell)
    ));

  const randomise = () => { setGrid(makeRandom()); setGen(0); setRunning(false); };
  const clear     = () => { setGrid(makeEmpty());  setGen(0); setRunning(false); };

  return (
    <section id="lab" className="gol-section section">
      <div className="section-inner">
        <h2 className="section-title gol-title">
          The <span className="gradient-text">Lab</span>
        </h2>

        <div className="lab-tabs">
          <button
            className={`lab-tab${activeGame === "gol" ? " active" : ""}`}
            onClick={() => { setActiveGame("gol"); setRunning(false); }}
          >
            Game of Life
          </button>
          <button
            className={`lab-tab${activeGame === "c4" ? " active" : ""}`}
            onClick={() => { setActiveGame("c4"); setRunning(false); }}
          >
            Connect Four
          </button>
        </div>

        {activeGame === "c4" ? <ConnectFour /> : <>
        <p className="gol-description">
          Click any cell to toggle it, then hit Play to watch the colony evolve.
        </p>

        <div className="gol-grid-wrap">
          <div className="gol-grid">
            {grid.map((row, r) =>
              row.map((alive, c) => (
                <button
                  key={`${r}-${c}`}
                  className={`gol-cell${alive ? " alive" : ""}`}
                  onClick={() => toggle(r, c)}
                  aria-label={`Cell ${r},${c} ${alive ? "alive" : "dead"}`}
                />
              ))
            )}
          </div>
        </div>

        <div className="gol-controls">
          <span className="gol-gen">Gen {gen}</span>

          <div className="gol-btns">
            <button
              className="btn-primary gol-btn"
              onClick={() => setRunning(r => !r)}
            >
              {running ? "Pause" : "Play"}
            </button>
            <button
              className="btn-secondary gol-btn"
              onClick={advance}
              disabled={running}
            >
              Step
            </button>
            <button
              className="btn-secondary gol-btn"
              onClick={randomise}
            >
              Random
            </button>
            <button
              className="btn-secondary gol-btn"
              onClick={clear}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="gol-speed">
          <label className="gol-speed-label" htmlFor="gol-speed">
            Speed — {Math.round(1000 / tickMs)} steps/s
          </label>
          <input
            id="gol-speed"
            type="range"
            min={50}
            max={1000}
            step={50}
            value={1050 - tickMs}
            onChange={e => setTickMs(1050 - Number(e.target.value))}
            className="gol-slider"
          />
          <div className="gol-speed-ends">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        <p className="gol-rules">
          <strong>Rules:</strong> a live cell with 2–3 neighbours survives; a dead cell
          with exactly 3 neighbours is born; all others die.
        </p>
        </>}
      </div>
    </section>
  );
}
