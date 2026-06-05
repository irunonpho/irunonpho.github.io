import { useState, useEffect } from "react";
import "./ConnectFour.css";

const ROWS = 6;
const COLS = 7;


type Cell = 0 | 1 | 2;
type Board = Cell[][];

interface HistoryEntry {
  id: number;
  winner: 1 | 2 | "draw";
  vsAI: boolean;
  depth?: number;
  board?: Board;
  winCells?: [number, number][] | null;
  timestamp?: number; // ms since epoch
}

// ── Board helpers ────────────────────────────────────────────────────────────

const emptyBoard = (): Board =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]);

function drop(board: Board, col: number, player: 1 | 2): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      return board.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === col ? player : cell)) as Cell[]
      );
    }
  }
  return null;
}

function getWin(board: Board): [number, number][] | null {
  const match = (cells: [number, number][]) =>
    board[cells[0][0]][cells[0][1]] !== 0 &&
    cells.every(([r, c]) => board[r][c] === board[cells[0][0]][cells[0][1]]);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const h: [number,number][] = [[r,c],[r,c+1],[r,c+2],[r,c+3]];
      if (c+3 < COLS && match(h)) return h;
      const v: [number,number][] = [[r,c],[r+1,c],[r+2,c],[r+3,c]];
      if (r+3 < ROWS && match(v)) return v;
      const d1: [number,number][] = [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];
      if (r+3 < ROWS && c+3 < COLS && match(d1)) return d1;
      const d2: [number,number][] = [[r,c],[r+1,c-1],[r+2,c-2],[r+3,c-3]];
      if (r+3 < ROWS && c-3 >= 0 && match(d2)) return d2;
    }
  }
  return null;
}

const validCols = (board: Board) =>
  Array.from({ length: COLS }, (_, c) => c).filter(c => board[0][c] === 0);

// ── AI: minimax with alpha-beta pruning ─────────────────────────────────────

function scoreWindow(w: Cell[]): number {
  const ai = w.filter(c => c === 2).length;
  const hu = w.filter(c => c === 1).length;
  const em = w.filter(c => c === 0).length;
  if (ai === 4)                return 10000;
  if (ai === 3 && em === 1)    return 10;
  if (ai === 2 && em === 2)    return 4;
  if (hu === 3 && em === 1)    return -20;
  if (hu === 2 && em === 2)    return -3;
  return 0;
}

function evaluate(board: Board): number {
  let s = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][3] === 2) s += 3;
    if (board[r][2] === 2 || board[r][4] === 2) s += 2;
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS-4; c++)
      s += scoreWindow([board[r][c],board[r][c+1],board[r][c+2],board[r][c+3]]);
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS-4; r++)
      s += scoreWindow([board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]]);
  for (let r = 0; r <= ROWS-4; r++)
    for (let c = 0; c <= COLS-4; c++)
      s += scoreWindow([board[r][c],board[r+1][c+1],board[r+2][c+2],board[r+3][c+3]]);
  for (let r = 0; r <= ROWS-4; r++)
    for (let c = 3; c < COLS; c++)
      s += scoreWindow([board[r][c],board[r+1][c-1],board[r+2][c-2],board[r+3][c-3]]);
  return s;
}

function minimax(
  board: Board, depth: number, alpha: number, beta: number, maxing: boolean
): [number, number] {
  const win = getWin(board);
  if (win) {
    const w = board[win[0][0]][win[0][1]];
    return [-1, w === 2 ? 100000 + depth : -100000 - depth];
  }
  const cols = validCols(board);
  if (!cols.length) return [-1, 0];
  if (depth === 0)  return [-1, evaluate(board)];

  // Try centre columns first for better pruning
  cols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

  let best = maxing ? -Infinity : Infinity;
  let bestCol = cols[0];
  for (const col of cols) {
    const [, score] = minimax(drop(board, col, maxing ? 2 : 1)!, depth-1, alpha, beta, !maxing);
    if (maxing ? score > best : score < best) { best = score; bestCol = col; }
    if (maxing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return [bestCol, best];
}

// Noise applied to each candidate score before selecting — higher noise = more random play.
// Wins/blocks (score ~100k) are always forced regardless of noise.
const DIFFICULTY_NOISE: Record<number, number> = { 2: 300, 3: 60, 4: 12, 5: 0 };

function getBestMove(board: Board, depth: number): number {
  const noise = DIFFICULTY_NOISE[depth] ?? 0;
  const cols = validCols(board);
  cols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

  let best = -Infinity;
  let bestCol = cols[0];
  for (const col of cols) {
    const [, score] = minimax(drop(board, col, 2)!, depth - 1, -Infinity, Infinity, false);
    const noisedScore = score + (Math.random() * 2 - 1) * noise;
    if (noisedScore > best) { best = noisedScore; bestCol = col; }
  }
  return bestCol;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ConnectFour() {
  const [board, setBoard]       = useState<Board>(emptyBoard);
  const [player, setPlayer]     = useState<1 | 2>(1);
  const [winCells, setWinCells] = useState<[number, number][] | null>(null);
  const [isDraw, setIsDraw]     = useState(false);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [vsAI, setVsAI]         = useState(false);
  const [aiDepth, setAiDepth]   = useState(4);
  const [aiThinking, setAiThinking] = useState(false);
  const [reviewEntry, setReviewEntry] = useState<HistoryEntry | null>(null);
  const [history, setHistory]   = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem("c4-history");
      return saved ? (JSON.parse(saved) as HistoryEntry[]) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("c4-history", JSON.stringify(history)); } catch { /* quota exceeded */ }
  }, [history]);

  const gameOver = !!(winCells || isDraw);
  const diffLocked = !gameOver && board.some(row => row.some(c => c !== 0));

  // Record result when game ends
  const recordResult = (b: Board, win: [number,number][] | null, _draw: boolean, ai: boolean) => {
    const winner: 1 | 2 | "draw" = win ? (b[win[0][0]][win[0][1]] as 1 | 2) : "draw";
    setHistory(h => [{ id: h.length + 1, winner, vsAI: ai, depth: ai ? aiDepth : undefined, board: b, winCells: win, timestamp: Date.now() }, ...h]);
  };

  // Apply a move — used by both human and AI
  const applyMove = (b: Board, col: number, p: 1 | 2, ai: boolean) => {
    const next = drop(b, col, p);
    if (!next) return false;
    const win = getWin(next);
    if (win) {
      setBoard(next); setWinCells(win);
      recordResult(next, win, false, ai);
      return true;
    }
    if (next[0].every(c => c !== 0)) {
      setBoard(next); setIsDraw(true);
      recordResult(next, null, true, ai);
      return true;
    }
    setBoard(next);
    setPlayer(p === 1 ? 2 : 1);
    return true;
  };

  const handleDrop = (col: number) => {
    if (gameOver || aiThinking || (vsAI && player === 2)) return;
    applyMove(board, col, player, vsAI);
  };

  // AI move trigger
  useEffect(() => {
    if (!vsAI || player !== 2 || gameOver || aiThinking) return;
    setAiThinking(true);
    const id = setTimeout(() => {
      const col = getBestMove(board, aiDepth);
      applyMove(board, col, 2, true);
      setAiThinking(false);
    }, 420);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vsAI, player, board, gameOver]);

  const reset = () => {
    setBoard(emptyBoard()); setPlayer(1);
    setWinCells(null); setIsDraw(false);
    setHoverCol(null); setAiThinking(false);
    setReviewEntry(null);
  };

  // Respond to navbar sub-menu: #lab-c4 → vs Human, #lab-c4-ai → vs AI
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#lab-c4-ai") {
        setVsAI(true);  reset();
      } else if (window.location.hash === "#lab-c4") {
        setVsAI(false); reset();
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When reviewing, display the historical board instead of the live one
  const displayBoard    = reviewEntry?.board    ?? board;
  const displayWinCells = reviewEntry?.winCells ?? winCells;
  const winSet = new Set(displayWinCells?.map(([r, c]) => `${r},${c}`) ?? []);
  const winner = displayWinCells ? (displayBoard[displayWinCells[0][0]][displayWinCells[0][1]] as 1 | 2) : null;

  return (
    <div className="c4-game">
      {/* Mode selector */}
      <div className="c4-mode">
        <button
          className={`c4-mode-btn${!vsAI ? " active" : ""}`}
          onClick={() => { setVsAI(false); reset(); }}
        >
          vs Human
        </button>
        <button
          className={`c4-mode-btn${vsAI ? " active" : ""}`}
          onClick={() => { setVsAI(true); reset(); }}
        >
          vs AI
        </button>
      </div>

      {/* Status */}
      <div className="c4-status">
        {reviewEntry ? (
          <>
            <span className="c4-badge reviewing">Reviewing Game #{reviewEntry.id}</span>
            <button className="c4-review-back" onClick={() => setReviewEntry(null)}>← Back</button>
          </>
        ) : aiThinking ? (
          <span className="c4-badge thinking">AI is thinking…</span>
        ) : winner ? (
          <span className={`c4-badge p${winner}`}>
            {winner === 2 && vsAI ? "AI wins!" : `Player ${winner} wins!`}
          </span>
        ) : isDraw ? (
          <span className="c4-badge draw">It's a draw!</span>
        ) : (
          <span className={`c4-badge p${player}`}>
            {vsAI && player === 2 ? "AI's turn" : `Player ${player}'s turn`}
          </span>
        )}
      </div>

      {/* Board + history aligned to the same top edge */}
      <div className="c4-board-row">
        <div className={`c4-board${reviewEntry ? " reviewing" : ""}`} onMouseLeave={() => setHoverCol(null)}>
          <div className="c4-indicators">
            {Array.from({ length: COLS }, (_, c) => (
              <div
                key={c}
                className={`c4-indicator${!reviewEntry && hoverCol === c && !gameOver && !aiThinking ? ` p${player}` : ""}`}
              />
            ))}
          </div>
          <div className="c4-grid">
            {displayBoard.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={[
                    "c4-cell",
                    cell ? `p${cell}` : "",
                    winSet.has(`${r},${c}`) ? "win" : "",
                    !reviewEntry && hoverCol === c && !cell && !gameOver && !aiThinking ? "hint" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => !reviewEntry && handleDrop(c)}
                  onMouseEnter={() => !reviewEntry && !gameOver && !aiThinking && setHoverCol(c)}
                />
              ))
            )}
          </div>
        </div>

        {/* Win history */}
        <div className="c4-history">
          <div className="c4-history-header">
            <p className="c4-history-title">Win History</p>
            {history.length > 0 && (
              <button className="c4-history-clear" onClick={() => setHistory([])}>
                Clear
              </button>
            )}
          </div>
          <div className="c4-history-list">
            {history.length === 0 ? (
              <p className="c4-history-empty">No games yet</p>
            ) : (
              history.map(e => (
                <div
                  key={e.id}
                  className={`c4-history-entry${e.board ? " clickable" : ""}${reviewEntry?.id === e.id ? " active" : ""}`}
                  onClick={() => e.board && setReviewEntry(reviewEntry?.id === e.id ? null : e)}
                  title={e.board ? "Click to review this game" : undefined}
                >
                  <span className="c4-history-num">#{e.id}</span>
                  <span className={`c4-badge sm ${e.winner === "draw" ? "draw" : `p${e.winner}`}`}>
                    {e.winner === "draw" ? "Draw" : e.winner === 2 && e.vsAI ? "AI" : `P${e.winner}`}
                  </span>
                  {e.vsAI && e.depth && (
                    <span className="c4-history-diff">
                      {["","","Easy","Med","Hard","Pro"][e.depth]}
                    </span>
                  )}
                  {e.timestamp && (
                    <span className="c4-history-time" title={new Date(e.timestamp).toLocaleString()}>
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {vsAI && (
        <div className="c4-difficulty">
          <label className="c4-diff-label" htmlFor="c4-depth">
            Difficulty — {["", "", "Easy", "Medium", "Hard", "Expert"][aiDepth]}
            {diffLocked && <span className="c4-diff-locked"> (locked)</span>}
          </label>
          <input
            id="c4-depth"
            type="range"
            min={2}
            max={5}
            step={1}
            value={aiDepth}
            disabled={diffLocked}
            onChange={e => setAiDepth(Number(e.target.value))}
            className={`gol-slider${diffLocked ? " locked" : ""}`}
          />
          <div className="c4-diff-ends">
            <span>Easy</span>
            <span>Expert</span>
          </div>
        </div>
      )}

      <button className="btn-secondary gol-btn" onClick={reset}>New Game</button>
    </div>
  );
}
