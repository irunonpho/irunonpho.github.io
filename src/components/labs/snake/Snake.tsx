import { useState, useEffect, useRef, useCallback } from "react";
import "./Snake.css";

const COLS = 20;
const ROWS = 20;
const INIT_POISON = 1;
const INIT_FOOD   = 1;
const GHOST_RESPAWN_MS = 10_000;
const GHOST_FLASH_MS   = 1_500;
const GHOST_SPEED      = 0.8; // fraction of player tick rate

type Dir = "U" | "D" | "L" | "R";
type Pt  = [number, number];

interface BestEntry { score: number; timestamp: number; }
type Bests = Record<number, BestEntry>;

const OPP: Record<Dir, Dir> = { U:"D", D:"U", L:"R", R:"L" };
const rnd = (n: number) => Math.floor(Math.random() * n);
const toKey = ([x, y]: Pt) => `${x},${y}`;

const mkOccupied = (...groups: Pt[][]): Set<string> =>
  new Set(groups.flat().map(toKey));

const spawnOne = (occ: Set<string>): Pt => {
  let pt: Pt;
  do { pt = [rnd(COLS), rnd(ROWS)]; } while (occ.has(toKey(pt)));
  return pt;
};

const spawnMany = (count: number, occ: Set<string>): Pt[] => {
  const result: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const pt = spawnOne(occ);
    occ.add(toKey(pt));
    result.push(pt);
  }
  return result;
};

const advance = ([x, y]: Pt, dir: Dir): Pt => {
  if (dir === "U") return [x, y - 1];
  if (dir === "D") return [x, y + 1];
  if (dir === "L") return [x - 1, y];
  return [x + 1, y];
};

const initSnake = (): Pt[] => [[10, 10], [9, 10], [8, 10]];
const initGhost = (): Pt[] => [[15, 5], [16, 5], [17, 5]];

function buildInitState() {
  const snake = initSnake();
  const ghost = initGhost();
  const occ = mkOccupied(snake, ghost);
  const food   = spawnMany(INIT_FOOD,   occ);
  const poison = spawnMany(INIT_POISON, occ);
  return { snake, ghost, food, poison };
}

// Food-avoidance accuracy per difficulty: 20% (Easy) → 95% (Expert)
const GHOST_ACCURACY: Record<number, number> = { 1: 0.20, 2: 0.45, 3: 0.70, 4: 0.95 };

// A* from ghost head to nearest poison. Returns first direction, or null if no path found.
function astar(ghost: Pt[], poison: Pt[], food: Pt[], curDir: Dir, avoidFood: boolean): Dir | null {
  if (!poison.length) return null;

  const [hx, hy] = ghost[0];
  const body    = new Set(ghost.slice(1).map(toKey));
  const targets = new Set(poison.map(toKey));
  const blocked = new Set(body);
  if (avoidFood) food.forEach(f => blocked.add(toKey(f)));

  const h = (x: number, y: number) =>
    poison.reduce((m, [px, py]) => Math.min(m, Math.abs(x - px) + Math.abs(y - py)), Infinity);

  type Node = [number, number, number, Dir | null]; // x, y, g, firstDir
  const open: Node[] = [[hx, hy, 0, null]];
  const gBest = new Map([[`${hx},${hy}`, 0]]);

  while (open.length) {
    // Extract node with lowest f = g + h
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i][2] + h(open[i][0], open[i][1]) < open[bi][2] + h(open[bi][0], open[bi][1])) bi = i;
    }
    const [x, y, g, fd] = open.splice(bi, 1)[0];

    if (targets.has(`${x},${y}`)) return fd;

    for (const d of (["U","D","L","R"] as Dir[])) {
      if (fd === null && d === OPP[curDir]) continue; // no U-turn from head
      const [nx, ny] = advance([x, y], d);
      const nkey = `${nx},${ny}`;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (blocked.has(nkey)) continue;
      const ng = g + 1;
      if ((gBest.get(nkey) ?? Infinity) > ng) {
        gBest.set(nkey, ng);
        open.push([nx, ny, ng, fd ?? d]);
      }
    }
  }
  return null;
}

function ghostNextDir(ghost: Pt[], poison: Pt[], food: Pt[], curDir: Dir, difficulty: number): Dir {
  const avoidFood = Math.random() < (GHOST_ACCURACY[difficulty] ?? 0.5);

  // Primary: A* with current food-avoidance roll; fallback: A* ignoring food
  const dir = astar(ghost, poison, food, curDir, avoidFood)
           ?? (avoidFood ? astar(ghost, poison, food, curDir, false) : null);
  if (dir !== null) return dir;

  // Absolute fallback: wander in any valid non-reversing direction
  const [hx, hy] = ghost[0];
  const body = new Set(ghost.slice(1).map(toKey));
  for (const d of ([curDir, "U","D","L","R"] as Dir[])) {
    if (d === OPP[curDir]) continue;
    const [nx, ny] = advance([hx, hy], d);
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !body.has(`${nx},${ny}`)) return d;
  }
  return curDir;
}

const DIFF_LABELS = ["", "Easy", "Medium", "Hard", "Expert"];
const DIFF_SPEEDS = [0, 220, 140, 75, 45];

export default function Snake() {
  const [initData] = useState(buildInitState);

  const [snake,      setSnake]      = useState<Pt[]>(initData.snake);
  const [food,       setFood]       = useState<Pt[]>(initData.food);
  const [buffer,     setBuffer]     = useState<Dir[]>(() => ["R"]);
  const [running,    setRunning]    = useState(false);
  const [dead,       setDead]       = useState(false);
  const [score,      setScore]      = useState(0);
  const [difficulty, setDifficulty] = useState(2);
  const [ghost,      setGhost]      = useState<Pt[]>(initData.ghost);
  const [ghostDir,   setGhostDir]   = useState<Dir>("L");
  const [ghostAlive, setGhostAlive] = useState(true);
  const [ghostFlash, setGhostFlash] = useState(false);
  const [poison,     setPoison]     = useState<Pt[]>(initData.poison);
  const [bests,      setBests]      = useState<Bests>(() => {
    try { return JSON.parse(localStorage.getItem("snake-bests") ?? "{}") as Bests; }
    catch { return {}; }
  });

  const speed = DIFF_SPEEDS[difficulty];

  useEffect(() => {
    try { localStorage.setItem("snake-bests", JSON.stringify(bests)); } catch {}
  }, [bests]);

  // Respawn timer: fires when ghost dies (ghostAlive → false)
  useEffect(() => {
    if (ghostAlive) return;
    const flashTimer   = setTimeout(() => setGhostFlash(false), GHOST_FLASH_MS);
    const respawnTimer = setTimeout(() => {
      setGhost(initGhost());
      setGhostDir("L");
      setGhostAlive(true);
      ghostAcc.current = 0;
    }, GHOST_RESPAWN_MS);
    return () => { clearTimeout(flashTimer); clearTimeout(respawnTimer); };
  }, [ghostAlive]);

  const latest = useRef({ snake, food, buffer, dead, difficulty, ghost, ghostDir, ghostAlive, poison, score });
  latest.current = { snake, food, buffer, dead, difficulty, ghost, ghostDir, ghostAlive, poison, score };
  const ghostAcc = useRef(0);

  const tick = useCallback(() => {
    const { snake, food, buffer, dead, difficulty, ghost, ghostDir, ghostAlive, poison, score } = latest.current;
    if (dead) return;

    // ── Consume one input from the buffer ────────────────────────────────────
    const dir = buffer[0];
    setBuffer(buffer.length > 1 ? buffer.slice(1) : buffer);

    // ── Player move ──────────────────────────────────────────────────────────
    const head = advance(snake[0], dir);
    const [hx, hy] = head;

    if (hx < 0 || hx >= COLS || hy < 0 || hy >= ROWS ||
        snake.some(([x, y]) => x === hx && y === hy)) {
      setRunning(false); setDead(true); return;
    }
    if (poison.some(([px, py]) => px === hx && py === hy)) {
      setRunning(false); setDead(true); return;
    }

    const ateIdx = food.findIndex(([fx, fy]) => fx === hx && fy === hy);
    const ate = ateIdx !== -1;
    const nextSnake: Pt[] = ate ? [head, ...snake] : [head, ...snake.slice(0, -1)];

    if (ate) {
      const s = score + 1;
      setScore(s);
      setBests(prev => s > (prev[difficulty]?.score ?? -1)
        ? { ...prev, [difficulty]: { score: s, timestamp: Date.now() } }
        : prev
      );
      const remaining = food.filter((_, i) => i !== ateIdx);
      const cap      = Math.floor((COLS * ROWS - nextSnake.length - ghost.length) / 2);
      const toSpawn  = Math.max(0, Math.min(2, cap - (remaining.length + poison.length)));
      const fresh    = toSpawn > 0 ? spawnMany(toSpawn, mkOccupied(nextSnake, ghost, remaining, poison)) : [];
      setFood([...remaining, ...fresh]);
    }
    setSnake(nextSnake);

    // ── Ghost move ────────────────────────────────────────────────────────────
    if (!ghostAlive) return;

    ghostAcc.current += GHOST_SPEED;
    if (ghostAcc.current < 1) return;
    ghostAcc.current -= 1;

    const nextGhostDir = ghostNextDir(ghost, poison, food, ghostDir, difficulty);
    const ghostHead = advance(ghost[0], nextGhostDir);
    const [gx, gy] = ghostHead;

    if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;

    // Self-collision or food collision → ghost dies, award bonus, trigger flash
    const ghostSelf = ghost.slice(1).some(([x, y]) => x === gx && y === gy);
    const ghostFood = food.some(([fx, fy]) => fx === gx && fy === gy);
    if (ghostSelf || ghostFood) {
      setScore(prev => {
        const newScore = prev * ghost.length;
        setBests(b => newScore > (b[difficulty]?.score ?? -1)
          ? { ...b, [difficulty]: { score: newScore, timestamp: Date.now() } }
          : b
        );
        return newScore;
      });
      setGhostAlive(false);
      setGhostFlash(true);
      ghostAcc.current = 0;
      return;
    }

    const eatIdx = poison.findIndex(([px, py]) => px === gx && py === gy);
    if (eatIdx !== -1) {
      const nextGhost: Pt[] = [ghostHead, ...ghost];
      const rest     = poison.filter((_, i) => i !== eatIdx);
      const cap      = Math.floor((COLS * ROWS - nextSnake.length - nextGhost.length) / 2);
      const toSpawn  = Math.max(0, Math.min(2, cap - (food.length + rest.length)));
      const fresh    = toSpawn > 0 ? spawnMany(toSpawn, mkOccupied(nextSnake, nextGhost, food, rest)) : [];
      setGhost(nextGhost);
      setGhostDir(nextGhostDir);
      setPoison([...rest, ...fresh]);
    } else {
      setGhost([ghostHead, ...ghost.slice(0, -1)]);
      setGhostDir(nextGhostDir);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, speed);
    return () => clearInterval(id);
  }, [running, speed, tick]);

  const steer = useCallback((d: Dir) => {
    setBuffer(prev => {
      const last = prev[prev.length - 1];
      if (d === OPP[last] || d === last || prev.length >= 2) return prev;
      return [...prev, d];
    });
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
    const { snake, ghost, food, poison } = buildInitState();
    setSnake(snake); setFood(food); setGhost(ghost); setGhostDir("L");
    setPoison(poison); setBuffer(["R"]); setRunning(false);
    setDead(false); setScore(0);
    setGhostAlive(true); setGhostFlash(false);
    ghostAcc.current = 0;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const snakeSet  = new Set(snake.map(toKey));
  const ghostSet  = new Set(ghost.map(toKey));
  const ghostHKey = toKey(ghost[0]);
  const poisonSet = new Set(poison.map(toKey));
  const foodSet   = new Set(food.map(toKey));
  const [hx, hy]  = snake[0];
  const bestEntry = bests[difficulty];
  const bestScore = bestEntry?.score ?? 0;
  const bestTooltip = bestEntry
    ? `Set on ${new Date(bestEntry.timestamp).toLocaleString()}`
    : undefined;

  return (
    <div className="snake-game">
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

      <div className="snake-board-wrap">
        <div className="snake-board">
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const key = `${c},${r}`;
              const isHead   = c === hx && r === hy;
              const isBody   = !isHead && snakeSet.has(key);
              const isFood   = foodSet.has(key);
              const isPoison = poisonSet.has(key);
              const isGhostH = ghostAlive && !isHead && !isBody && !isFood && !isPoison && key === ghostHKey;
              const isGhostB = ghostAlive && !isHead && !isBody && !isFood && !isPoison && !isGhostH && ghostSet.has(key);
              return (
                <div
                  key={key}
                  className={[
                    "snake-cell",
                    isHead   ? "head"       : "",
                    isBody   ? "body"       : "",
                    isFood   ? "food"       : "",
                    isPoison ? "poison"     : "",
                    isGhostH ? "ghost-head" : "",
                    isGhostB ? "ghost-body" : "",
                  ].filter(Boolean).join(" ")}
                />
              );
            })
          )}
        </div>

        {ghostFlash && <div className="snake-rainbow-flash" />}

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

      <div className="snake-dpad">
        <button className="snake-dpad-btn snake-dpad-up"    onPointerDown={() => { steer("U"); if (!dead) setRunning(true); }}>↑</button>
        <button className="snake-dpad-btn snake-dpad-left"  onPointerDown={() => { steer("L"); if (!dead) setRunning(true); }}>←</button>
        <button className="snake-dpad-btn snake-dpad-right" onPointerDown={() => { steer("R"); if (!dead) setRunning(true); }}>→</button>
        <button className="snake-dpad-btn snake-dpad-down"  onPointerDown={() => { steer("D"); if (!dead) setRunning(true); }}>↓</button>
      </div>

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
