import { useState, useEffect, useRef, useCallback } from "react";
import "./Snake.css";

const COLS = 20;
const ROWS = 20;

type Dir = "U" | "D" | "L" | "R";
type Pt  = [number, number];

interface BestEntry { score: number; timestamp: number; }
type Bests = Record<number, BestEntry>;

const OPP: Record<Dir, Dir> = { U:"D", D:"U", L:"R", R:"L" };
const rnd = (n: number) => Math.floor(Math.random() * n);
const initSnake = (): Pt[] => [[10, 10], [9, 10], [8, 10]];

const spawnFood = (snake: Pt[]): Pt => {
  const occupied = new Set(snake.map(([x, y]) => `${x},${y}`));
  let pt: Pt;
  do { pt = [rnd(COLS), rnd(ROWS)]; }
  while (occupied.has(`${pt[0]},${pt[1]}`));
  return pt;
};

const advance = ([x, y]: Pt, dir: Dir): Pt => {
  if (dir === "U") return [x, y - 1];
  if (dir === "D") return [x, y + 1];
  if (dir === "L") return [x - 1, y];
  return [x + 1, y];
};

const DIFF_LABELS = ["", "Easy", "Medium", "Hard", "Expert"];
const DIFF_SPEEDS = [0, 220, 140, 75, 45];

export default function Snake() {
  const [snake,      setSnake]      = useState<Pt[]>(initSnake);
  const [food,       setFood]       = useState<Pt>(() => spawnFood(initSnake()));
  const [queued,     setQueued]     = useState<Dir>("R");
  const [running,    setRunning]    = useState(false);
  const [dead,       setDead]       = useState(false);
  const [score,      setScore]      = useState(0);
  const [difficulty, setDifficulty] = useState(2);
  const [bests,      setBests]      = useState<Bests>(() => {
    try { return JSON.parse(localStorage.getItem("snake-bests") ?? "{}") as Bests; }
    catch { return {}; }
  });

  const speed = DIFF_SPEEDS[difficulty];

  // Persist bests
  useEffect(() => {
    try { localStorage.setItem("snake-bests", JSON.stringify(bests)); } catch {}
  }, [bests]);

  // Mutable ref so the interval always reads the latest state
  const latest = useRef({ snake, food, queued, dead, difficulty });
  latest.current = { snake, food, queued, dead, difficulty };

  const tick = useCallback(() => {
    const { snake, food, queued, dead, difficulty } = latest.current;
    if (dead) return;

    const head = advance(snake[0], queued);
    const [hx, hy] = head;

    if (hx < 0 || hx >= COLS || hy < 0 || hy >= ROWS ||
        snake.some(([x, y]) => x === hx && y === hy)) {
      setRunning(false);
      setDead(true);
      return;
    }

    const ate = hx === food[0] && hy === food[1];
    const next: Pt[] = ate ? [head, ...snake] : [head, ...snake.slice(0, -1)];

    if (ate) {
      const s = next.length - 3;
      setScore(s);
      setBests(prev => {
        if (s > (prev[difficulty]?.score ?? -1)) {
          return { ...prev, [difficulty]: { score: s, timestamp: Date.now() } };
        }
        return prev;
      });
      setFood(spawnFood(next));
    }

    setSnake(next);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, speed);
    return () => clearInterval(id);
  }, [running, speed, tick]);

  const steer = useCallback((d: Dir) => {
    setQueued(cur => (d === OPP[cur] ? cur : d));
  }, []);

  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowUp:"U", ArrowDown:"D", ArrowLeft:"L", ArrowRight:"R",
      w:"U", s:"D", a:"L", d:"R",
      W:"U", S:"D", A:"L", D:"R",
    };
    const onKey = (e: KeyboardEvent) => {
      const d = map[e.key];
      if (!d) return;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
      steer(d);
      if (!latest.current.dead) setRunning(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steer]);

  const reset = () => {
    const s = initSnake();
    setSnake(s); setFood(spawnFood(s));
    setQueued("R"); setRunning(false);
    setDead(false); setScore(0);
  };

  const snakeSet  = new Set(snake.map(([x, y]) => `${x},${y}`));
  const [hx, hy]  = snake[0];
  const bestEntry = bests[difficulty];
  const bestScore = bestEntry?.score ?? 0;
  const bestTooltip = bestEntry
    ? `Set on ${new Date(bestEntry.timestamp).toLocaleString()}`
    : undefined;

  return (
    <div className="snake-game">
      {/* Scoreboard */}
      <div className="snake-scores">
        <span className="snake-score">Score <strong>{score}</strong></span>
        <span
          className="snake-score"
          title={bestTooltip}
          style={{ cursor: bestEntry ? "help" : "default" }}
        >
          Best <strong>{bestScore}</strong>
          {bestEntry && <span className="snake-best-diff"> ({DIFF_LABELS[difficulty]})</span>}
        </span>
      </div>

      {/* Board */}
      <div className="snake-board-wrap">
        <div className="snake-board">
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const isHead = c === hx && r === hy;
              const isBody = !isHead && snakeSet.has(`${c},${r}`);
              const isFood = c === food[0] && r === food[1];
              return (
                <div
                  key={`${c},${r}`}
                  className={[
                    "snake-cell",
                    isHead ? "head" : "",
                    isBody ? "body" : "",
                    isFood ? "food" : "",
                  ].filter(Boolean).join(" ")}
                />
              );
            })
          )}
        </div>

        {dead && (
          <div className="snake-overlay">
            <p className="snake-over-title">Game Over</p>
            <p className="snake-over-score">Score: {score}</p>
            <button className="btn-primary" onClick={reset}>Play Again</button>
          </div>
        )}
        {!running && !dead && (
          <div className="snake-overlay">
            <p className="snake-start-hint">Press arrow / WASD to start</p>
            <div className="snake-dpad-hint">or tap below ↓</div>
          </div>
        )}
      </div>

      {/* D-pad */}
      <div className="snake-dpad">
        <button className="snake-dpad-btn" onClick={() => { steer("U"); if (!dead) setRunning(true); }}>↑</button>
        <div className="snake-dpad-mid">
          <button className="snake-dpad-btn" onClick={() => { steer("L"); if (!dead) setRunning(true); }}>←</button>
          <button className="snake-dpad-btn" onClick={() => { steer("R"); if (!dead) setRunning(true); }}>→</button>
        </div>
        <button className="snake-dpad-btn" onClick={() => { steer("D"); if (!dead) setRunning(true); }}>↓</button>
      </div>

      {/* Difficulty */}
      <div className="snake-footer">
        <div className="gol-speed" style={{ maxWidth: 320 }}>
          <label className="gol-speed-label">
            Difficulty — {DIFF_LABELS[difficulty]}
            {running && <span className="c4-diff-locked"> (locked)</span>}
          </label>
          <input
            type="range" min={1} max={4} step={1}
            value={difficulty}
            disabled={running}
            onChange={e => setDifficulty(Number(e.target.value))}
            className={`gol-slider${running ? " locked" : ""}`}
          />
          <div className="gol-speed-ends"><span>Easy</span><span>Expert</span></div>
        </div>
      </div>
    </div>
  );
}
