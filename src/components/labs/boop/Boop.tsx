import { useState } from "react";
import "./Boop.css";

// ── Types ────────────────────────────────────────────────────────────────────

const SIZE = 6;
type PlayerID  = 1 | 2;
type PieceType = "kitten" | "cat";
interface Piece  { owner: PlayerID; type: PieceType; }
type Cell  = Piece | null;
type Board = Cell[][];
interface Reserve { kittens: number; cats: number; }
type Triad = [[number,number],[number,number],[number,number]];
type Phase = "playing" | "awaiting_graduation" | "awaiting_upgrade" | "game_over";
interface GradTask { player: PlayerID; eligibleCells: Set<string>; triads: Triad[]; }

const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] as const;

const PIECE_ICONS: Record<PlayerID, Record<PieceType, string>> = {
  1: { kitten: "/boop/black-kitten.png", cat: "/boop/black-cat.png"   },
  2: { kitten: "/boop/orange-kitten.png", cat: "/boop/orange-cat.png" },
};

// ── Pure game logic ──────────────────────────────────────────────────────────

const emptyBoard   = (): Board => Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
const initReserves = (): [Reserve, Reserve] => [{ kittens: 8, cats: 0 }, { kittens: 8, cats: 0 }];

function countPieces(board: Board, player: PlayerID, type: PieceType): number {
  let n = 0;
  for (const row of board) for (const cell of row)
    if (cell?.owner === player && cell.type === type) n++;
  return n;
}

function applyBoops(
  board: Board, pr: number, pc: number, placed: Piece, res: [Reserve, Reserve]
): { board: Board; reserves: [Reserve, Reserve] } {
  const b = board.map(r => [...r]);
  const rs: [Reserve, Reserve] = [{ ...res[0] }, { ...res[1] }];
  type Move = { fr: number; fc: number; tr: number; tc: number; off: boolean };
  const moves: Move[] = [];

  for (const [dr, dc] of DIRS) {
    const nr = pr + dr, nc = pc + dc;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
    const nbr = board[nr][nc];
    if (!nbr) continue;
    if (placed.type === "kitten" && nbr.type === "cat") continue;
    const tr = nr + dr, tc = nc + dc;
    const off = tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE;
    if (off) moves.push({ fr: nr, fc: nc, tr, tc, off: true });
    else if (!board[tr][tc]) moves.push({ fr: nr, fc: nc, tr, tc, off: false });
  }

  for (const m of moves) {
    const piece = b[m.fr][m.fc];
    if (!piece) continue;
    b[m.fr][m.fc] = null;
    if (m.off) {
      const pi = piece.owner - 1;
      piece.type === "kitten" ? rs[pi].kittens++ : rs[pi].cats++;
    } else {
      b[m.tr][m.tc] = piece;
    }
  }
  return { board: b, reserves: rs };
}

function findTriads(board: Board, player: PlayerID, type: PieceType): Triad[] {
  const is = (r: number, c: number) =>
    board[r]?.[c]?.owner === player && board[r]?.[c]?.type === type;
  const out: Triad[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c <= SIZE - 3; c++)
      if (is(r,c)&&is(r,c+1)&&is(r,c+2)) out.push([[r,c],[r,c+1],[r,c+2]]);
  for (let c = 0; c < SIZE; c++)
    for (let r = 0; r <= SIZE - 3; r++)
      if (is(r,c)&&is(r+1,c)&&is(r+2,c)) out.push([[r,c],[r+1,c],[r+2,c]]);
  for (let r = 0; r <= SIZE - 3; r++)
    for (let c = 0; c <= SIZE - 3; c++)
      if (is(r,c)&&is(r+1,c+1)&&is(r+2,c+2)) out.push([[r,c],[r+1,c+1],[r+2,c+2]]);
  for (let r = 0; r <= SIZE - 3; r++)
    for (let c = 2; c < SIZE; c++)
      if (is(r,c)&&is(r+1,c-1)&&is(r+2,c-2)) out.push([[r,c],[r+1,c-1],[r+2,c-2]]);
  return out;
}

function checkWinner(board: Board): { winner: PlayerID; triad: Triad | null } | null {
  for (const p of [1, 2] as PlayerID[]) {
    const t = findTriads(board, p, "cat");
    if (t.length) return { winner: p, triad: t[0] };
  }
  for (const p of [1, 2] as PlayerID[]) {
    if (countPieces(board, p, "cat") >= 8) return { winner: p, triad: null };
  }
  return null;
}

function findGradSets(board: Board, player: PlayerID): { eligibleCells: Set<string>; triads: Triad[] } {
  // Triad = 3 consecutive cells all owned by player (any mix of kitten/cat),
  // but must contain at least one kitten (pure-cat triads are wins, not graduations).
  const owned = (r: number, c: number) => board[r]?.[c]?.owner === player;
  const triads: Triad[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c <= SIZE - 3; c++)
      if (owned(r,c)&&owned(r,c+1)&&owned(r,c+2)) triads.push([[r,c],[r,c+1],[r,c+2]]);
  for (let c = 0; c < SIZE; c++)
    for (let r = 0; r <= SIZE - 3; r++)
      if (owned(r,c)&&owned(r+1,c)&&owned(r+2,c)) triads.push([[r,c],[r+1,c],[r+2,c]]);
  for (let r = 0; r <= SIZE - 3; r++)
    for (let c = 0; c <= SIZE - 3; c++)
      if (owned(r,c)&&owned(r+1,c+1)&&owned(r+2,c+2)) triads.push([[r,c],[r+1,c+1],[r+2,c+2]]);
  for (let r = 0; r <= SIZE - 3; r++)
    for (let c = 2; c < SIZE; c++)
      if (owned(r,c)&&owned(r+1,c-1)&&owned(r+2,c-2)) triads.push([[r,c],[r+1,c-1],[r+2,c-2]]);

  const eligibleCells = new Set<string>();
  const mixedTriads: Triad[] = [];
  for (const triad of triads) {
    const kittens = triad.filter(([r, c]) => board[r][c]?.type === "kitten");
    if (kittens.length === 0) continue; // pure-cat triad → win, not graduation
    mixedTriads.push(triad);
    for (const [r, c] of triad) eligibleCells.add(`${r},${c}`);
  }
  return { eligibleCells, triads: mixedTriads };
}

function buildGradQueue(board: Board, currentPlayer: PlayerID): GradTask[] {
  const queue: GradTask[] = [];
  const opp: PlayerID = currentPlayer === 1 ? 2 : 1;
  for (const p of [currentPlayer, opp] as PlayerID[]) {
    const { eligibleCells, triads } = findGradSets(board, p);
    if (eligibleCells.size > 0) queue.push({ player: p, eligibleCells, triads });
  }
  return queue;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Boop() {
  const [board,         setBoard]         = useState<Board>(emptyBoard);
  const [reserves,      setReserves]      = useState<[Reserve, Reserve]>(initReserves);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerID>(1);
  const [pieceType,     setPieceType]     = useState<PieceType>("kitten");
  const [phase,         setPhase]         = useState<Phase>("playing");
  const [winner,        setWinner]        = useState<PlayerID | null>(null);
  const [winTriad,      setWinTriad]      = useState<Triad | null>(null);
  const [boopedCells,     setBoopedCells]     = useState<Set<string>>(new Set());
  const [gradCells,       setGradCells]       = useState<Set<string>>(new Set());
  const [gradQueue,       setGradQueue]       = useState<GradTask[]>([]);
  const [pendingBoard,    setPendingBoard]    = useState<Board | null>(null);
  const [pendingRes,      setPendingRes]      = useState<[Reserve, Reserve] | null>(null);
  const [hoveredTriadIdx, setHoveredTriadIdx] = useState<number | null>(null);

  const pIdx       = currentPlayer - 1;
  const reserve    = reserves[pIdx];
  const hasKittens = reserve.kittens > 0;
  const hasCats    = reserve.cats    > 0;
  const effective: PieceType = hasKittens && hasCats ? pieceType : hasKittens ? "kitten" : "cat";

  const currentGradTask = gradQueue[0] ?? null;
  const activeBoard = phase === "awaiting_graduation" && pendingBoard ? pendingBoard : board;

  const advanceTurn = (b: Board, rs: [Reserve, Reserve], cp: PlayerID) => {
    const next: PlayerID = cp === 1 ? 2 : 1;
    setCurrentPlayer(next);
    const nr = rs[next - 1];
    setPieceType(nr.kittens > 0 ? "kitten" : "cat");

    if (nr.kittens === 0 && nr.cats === 0) {
      const piecesOB = countPieces(b, next, "kitten") + countPieces(b, next, "cat");
      if (piecesOB === 0) {
        setWinner(next);
        setWinTriad(null);
        setPhase("game_over");
      } else {
        setPhase("awaiting_upgrade");
      }
    } else {
      setPhase("playing");
    }
  };

  // Called after placement + graduation resolve. Checks if the current player's
  // reserve just ran out and they still have kittens to upgrade before advancing.
  const finishTurn = (b: Board, rs: [Reserve, Reserve], cp: PlayerID) => {
    const result = checkWinner(b);
    setBoard(b);
    setReserves(rs);
    setPendingBoard(null);
    setPendingRes(null);
    setGradQueue([]);

    if (result) {
      setWinner(result.winner);
      setWinTriad(result.triad);
      setPhase("game_over");
      return;
    }

    const cpr = rs[cp - 1];
    if (cpr.kittens === 0 && cpr.cats === 0) {
      const piecesOB = countPieces(b, cp, "kitten") + countPieces(b, cp, "cat");
      if (piecesOB === 0) {
        setWinner(cp);
        setWinTriad(null);
        setPhase("game_over");
      } else {
        setPhase("awaiting_upgrade");
      }
      return;
    }

    advanceTurn(b, rs, cp);
  };

  const handlePlacement = (r: number, c: number) => {
    if (board[r][c] || (!hasKittens && !hasCats)) return;

    const piece: Piece = { owner: currentPlayer, type: effective };
    let b = board.map(row => [...row]);
    b[r][c] = piece;
    let rs: [Reserve, Reserve] = [{ ...reserves[0] }, { ...reserves[1] }];
    effective === "kitten" ? rs[pIdx].kittens-- : rs[pIdx].cats--;

    const afterBoop = applyBoops(b, r, c, piece, rs);
    b = afterBoop.board; rs = afterBoop.reserves;

    const newBooped = new Set<string>();
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
      if (board[nr][nc] && b[nr + dr]?.[nc + dc] !== board[nr][nc]) newBooped.add(`${nr},${nc}`);
    }
    setBoopedCells(newBooped);
    setGradCells(new Set());

    const queue = buildGradQueue(b, currentPlayer);
    if (queue.length) {
      setPendingBoard(b);
      setPendingRes(rs);
      setGradQueue(queue);
      setPhase("awaiting_graduation");
    } else {
      finishTurn(b, rs, currentPlayer);
    }
  };

  const handleGraduationChoice = (r: number, c: number) => {
    if (!currentGradTask || !pendingBoard || !pendingRes) return;
    const key = `${r},${c}`;
    if (!currentGradTask.eligibleCells.has(key)) return;

    const b = pendingBoard.map(row => [...row]);
    const rs: [Reserve, Reserve] = [{ ...pendingRes[0] }, { ...pendingRes[1] }];
    const pi = currentGradTask.player - 1;

    // Find the one triad that contains the chosen kitten and clear only those cells
    const matchedTriad = currentGradTask.triads.find(t =>
      t.some(([tr, tc]) => tr === r && tc === c)
    )!;
    const clearedKeys = new Set(matchedTriad.map(([tr, tc]) => `${tr},${tc}`));

    for (const [tr, tc] of matchedTriad) {
      const piece = b[tr][tc];
      if (!piece || piece.owner !== currentGradTask.player) continue;
      b[tr][tc] = null;
      rs[pi].cats++;                            // all pieces in the triad graduate
    }

    setGradCells(clearedKeys);
    setHoveredTriadIdx(null);
    const remaining = gradQueue.slice(1);
    setPendingBoard(b);
    setPendingRes(rs);
    setGradQueue(remaining);

    if (remaining.length === 0) finishTurn(b, rs, currentPlayer);
  };

  const handleUpgradeChoice = (r: number, c: number) => {
    const cell = board[r][c];
    if (!cell || cell.owner !== currentPlayer) return;

    const b = board.map(row => [...row]);
    b[r][c] = null;
    const rs: [Reserve, Reserve] = [{ ...reserves[0] }, { ...reserves[1] }];
    // Kittens upgrade to cats; cats are retrieved as-is — both add a cat to reserve
    rs[currentPlayer - 1].cats++;
    setBoard(b);
    setReserves(rs);
    setGradCells(new Set([`${r},${c}`]));

    const result = checkWinner(b);
    if (result) {
      setWinner(result.winner);
      setWinTriad(result.triad);
      setPhase("game_over");
      return;
    }

    advanceTurn(b, rs, currentPlayer);
  };

  const handleCellClick = (r: number, c: number) => {
    if      (phase === "playing")             handlePlacement(r, c);
    else if (phase === "awaiting_graduation") handleGraduationChoice(r, c);
    else if (phase === "awaiting_upgrade")    handleUpgradeChoice(r, c);
  };

  const reset = () => {
    setBoard(emptyBoard()); setReserves(initReserves());
    setCurrentPlayer(1); setPieceType("kitten");
    setPhase("playing"); setWinner(null); setWinTriad(null);
    setBoopedCells(new Set()); setGradCells(new Set());
    setGradQueue([]); setPendingBoard(null); setPendingRes(null);
    setHoveredTriadIdx(null);
  };

  const winSet       = new Set(winTriad?.map(([r, c]) => `${r},${c}`) ?? []);
  const gradEligible = phase === "awaiting_graduation" && currentGradTask
    ? currentGradTask.eligibleCells : new Set<string>();
  const hoveredTriadCells = phase === "awaiting_graduation" && currentGradTask && hoveredTriadIdx !== null
    ? new Set(currentGradTask.triads[hoveredTriadIdx]?.map(([r, c]) => `${r},${c}`) ?? [])
    : new Set<string>();

  const badgePlayer: PlayerID = phase === "awaiting_graduation"
    ? (currentGradTask?.player ?? currentPlayer) : currentPlayer;

  const statusMsg = () => {
    if (phase === "game_over")          return `Player ${winner} wins!`;
    if (phase === "awaiting_graduation") return `Player ${currentGradTask?.player} — choose a triad to graduate`;
    if (phase === "awaiting_upgrade")   return `Player ${currentPlayer} — upgrade a kitten or retrieve a cat`;
    if (!hasKittens && !hasCats)        return `Player ${currentPlayer} — no pieces!`;
    return `Player ${currentPlayer} — place a ${effective}`;
  };

  const ReservePanel = ({ player }: { player: PlayerID }) => {
    const r = reserves[player - 1];
    const isActive = phase === "awaiting_graduation"
      ? currentGradTask?.player === player
      : player === currentPlayer && phase !== "game_over";
    return (
      <div className={`boop-reserve p${player}${isActive ? " active" : ""}`}>
        <p className="boop-reserve-name">Player {player}</p>
        <div className="boop-reserve-pieces">
          <div className="boop-reserve-row">
            <img src={PIECE_ICONS[player]["kitten"]} className="boop-pip" alt="kitten" />
            <span>{r.kittens}</span>
          </div>
          <div className="boop-reserve-row">
            <img src={PIECE_ICONS[player]["cat"]} className="boop-pip" alt="cat" />
            <span>{r.cats}</span>
          </div>
        </div>
        {player === currentPlayer && phase === "playing" && hasKittens && hasCats && (
          <div className="boop-type-select">
            <button
              className={`boop-type-btn${pieceType === "kitten" ? " sel" : ""}`}
              onClick={() => setPieceType("kitten")}
            >Kitten</button>
            <button
              className={`boop-type-btn${pieceType === "cat" ? " sel" : ""}`}
              onClick={() => setPieceType("cat")}
            >Cat</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="boop-game">
      <div className="boop-status">
        <span className={`c4-badge p${phase === "game_over" ? winner : badgePlayer}`}>
          {statusMsg()}
        </span>
      </div>

      <div className="boop-layout">
        <ReservePanel player={1} />

        <div className="boop-board-wrap">
          <div className="boop-board">
            {activeBoard.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const isUpgradeKitten = phase === "awaiting_upgrade"
                  && cell?.owner === currentPlayer && cell.type === "kitten";
                const isUpgradeCat = phase === "awaiting_upgrade"
                  && cell?.owner === currentPlayer && cell.type === "cat";
                return (
                  <div
                    key={key}
                    className={[
                      "boop-cell",
                      !cell && phase === "playing" && (hasKittens || hasCats) ? "empty-hover" : "",
                      gradEligible.has(key)      ? "eligible-grad"    : "",
                      hoveredTriadCells.has(key) ? "hovered-triad"    : "",
                      isUpgradeKitten            ? "eligible-upgrade"  : "",
                      isUpgradeCat               ? "eligible-retrieve" : "",
                      winSet.has(key)            ? "win"               : "",
                      gradCells.has(key)         ? "grad"              : "",
                      boopedCells.has(key)       ? "booped"            : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => {
                      if (phase !== "awaiting_graduation" || !currentGradTask) return;
                      const idx = currentGradTask.triads.findIndex(t =>
                        t.some(([tr, tc]) => tr === r && tc === c)
                      );
                      setHoveredTriadIdx(idx >= 0 ? idx : null);
                    }}
                    onMouseLeave={() => {
                      if (phase === "awaiting_graduation") setHoveredTriadIdx(null);
                    }}
                  >
                    {cell && (
                      <img
                        src={PIECE_ICONS[cell.owner][cell.type]}
                        className={`boop-piece ${cell.type}`}
                        alt={`p${cell.owner} ${cell.type}`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {phase === "game_over" && (
            <div className="boop-overlay">
              <p className="boop-win-title">Player {winner} wins!</p>
              <button className="btn-primary" onClick={reset}>Play Again</button>
            </div>
          )}
        </div>

        <ReservePanel player={2} />
      </div>

      <button className="btn-secondary gol-btn" onClick={reset}>New Game</button>

      <p className="boop-hint">
        Line up 3 kittens to graduate them into cats · 3 cats in a row wins
      </p>
    </div>
  );
}
