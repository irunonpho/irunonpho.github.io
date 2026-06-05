# Boop — Game Implementation Specification

**Game:** Boop (Smirk & Dagger Games)
**Players:** 2
**Target Playtime:** ~20 minutes
**Spec Version:** 2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Game Components](#game-components)
3. [Data Model](#data-model)
4. [Game Setup](#game-setup)
5. [Turn Structure](#turn-structure)
6. [Core Mechanic: Booping](#core-mechanic-booping)
7. [Graduation: Triads → Cats](#graduation-triads--cats)
8. [Cats on the Board](#cats-on-the-board)
9. [Win Condition](#win-condition)
10. [Edge Cases & Special Rules](#edge-cases--special-rules)
11. [Game State Machine](#game-state-machine)
12. [Suggested UI States](#suggested-ui-states)

---

## Overview

Boop is a two-player abstract strategy game played on a 6×6 grid (representing a bed). Players alternate placing pieces on the board. Each placement "boops" (pushes) all adjacent pieces one space outward. Lining up three of your own pieces in a row (any combination of kittens and cats) triggers graduation. Three cats in a row wins the game.

---

## Game Components

| Component | Count | Notes |
|-----------|-------|-------|
| Game board | 1 | 6×6 grid of spaces |
| Kittens (Player 1) | 8 | Smaller pieces |
| Kittens (Player 2) | 8 | Smaller pieces, different color |
| Cats (Player 1) | 8 | Larger pieces, same color as P1 kittens |
| Cats (Player 2) | 8 | Larger pieces, same color as P2 kittens |

Each player has **8 kittens** and **8 cats**. All pieces start off-board in each player's reserve.

---

## Data Model

### Board

```
Board: 6×6 grid
Cell: (row: 0–5, col: 0–5)
Cell state: EMPTY | { owner: PlayerID, type: PieceType }

PlayerID: PLAYER_1 | PLAYER_2
PieceType: KITTEN | CAT
```

### Player State

```
PlayerState:
  id: PlayerID
  kittensInReserve: int   // starts at 8
  catsInReserve: int      // starts at 0; cats enter reserve only via graduation or upgrade
```

### Game State

```
GameState:
  board: Cell[6][6]
  players: PlayerState[2]
  currentPlayer: PlayerID
  phase: Phase
  winner: PlayerID | null
```

### Phase

```
playing
awaiting_graduation
awaiting_upgrade
game_over
```

---

## Game Setup

1. Initialize all 36 board cells to `EMPTY`.
2. Each player begins with `kittensInReserve = 8`, `catsInReserve = 0`.
3. Determine the first player (coin flip, mutual agreement, or random).
4. Set `currentPlayer` to the first player.
5. Set `phase = playing`.

---

## Turn Structure

Each turn consists of the following steps executed in order:

```
1. PLACE_PIECE
2. RESOLVE_BOOPS
3. CHECK_GRADUATION
4. CHECK_EMPTY_RESERVE  ← mid-turn upgrade prompt for current player
5. CHECK_WIN
6. ADVANCE_TURN
```

### Step 1 — Place Piece

The current player selects any **empty** cell on the board and places **one piece** from their reserve onto it.

**Placement rules:**
- The player must have at least one piece in reserve (kitten or cat) to place.
- A player may choose to place a **kitten** or a **cat** from their reserve, subject to availability.
- At the start of the game all players have zero cats in reserve. Cats only enter reserve via graduation or upgrade.
- A player with no kittens in reserve **must** place a cat (if available).
- A player with no pieces at all in reserve cannot take a normal turn — see [No Available Pieces in Reserve](#no-available-pieces-in-reserve).

### Step 2 — Resolve Boops

After placement, the newly placed piece "boops" every orthogonally and diagonally adjacent piece exactly one step away from the placed piece.

See [Core Mechanic: Booping](#core-mechanic-booping) for full logic.

### Step 3 — Check Graduation

After all boops resolve, scan the board for any three-in-a-row of the **current player's** pieces (kittens or cats, in any combination), then the **opponent's** pieces.

A qualifying triad must contain at least one kitten — pure-cat triads are a win condition, not a graduation trigger.

If a qualifying triad is found, the owning player must click one of its **kittens** to graduate. That resolves the triad. Check both players; resolve current player's graduation first, then the opponent's.

See [Graduation](#graduation-triads--cats) for full logic.

### Step 4 — Check Empty Reserve (Mid-Turn Upgrade)

After graduation resolves, check if the **current player's** reserve is now empty (`kittensInReserve == 0 && catsInReserve == 0`).

- If empty **and** the player has kittens on the board → enter `awaiting_upgrade`: prompt them to select one of their on-board kittens to upgrade. The kitten is removed and one cat enters `catsInReserve`. No boop occurs.
- If empty **and** no kittens on the board → current player wins immediately (Win Condition 2).

This check runs for the **current player** before advancing the turn, and again for the **next player** at the start of their turn.

### Step 5 — Check Win

After graduation (and any upgrade) resolves, check whether either player has three **cats** in a row.

If yes, that player wins. Set `winner` and `phase = game_over`.

### Step 6 — Advance Turn

If no winner, flip `currentPlayer` to the other player. Before they act, re-run the empty-reserve check for the new current player.

---

## Core Mechanic: Booping

When a piece is placed at cell `(r, c)`, it boops all pieces in the 8 surrounding cells (Moore neighborhood).

### Boop Algorithm

For each of the 8 neighbors `(nr, nc)` of the placed cell `(r, c)`:

1. If `(nr, nc)` is empty → skip.
2. Determine the **push direction**: `dr = nr - r`, `dc = nc - c` (each will be -1, 0, or 1).
3. Calculate the **destination cell**: `(nr + dr, nc + dc)`.
4. **Boop resolution:**
   - If the destination is **within bounds and empty** → move the piece from `(nr, nc)` to the destination.
   - If the destination is **out of bounds** → remove the piece from the board entirely; return it to its owner's reserve.
   - If the destination is **occupied** → the piece at `(nr, nc)` does **not** move (blocked).

### Boop Interaction Rules: Kittens vs Cats

| Placed piece | Adjacent piece | Can boop? |
|---|---|---|
| Kitten | Kitten | Yes |
| Kitten | Cat | **No** — kittens cannot boop cats |
| Cat | Kitten | Yes |
| Cat | Cat | Yes |

### Boop Order

All eight neighboring cells are evaluated based on the board state **at the moment of placement** (before any boop moves). All boops from a single placement resolve simultaneously.

> **Implementation note:** Collect all (source, destination) moves first, then apply them. This prevents a moved piece from being double-counted.

### Pieces Pushed Off the Board

If a piece is pushed off the edge, remove it from the board and return it to the owning player's reserve (`kittensInReserve++` or `catsInReserve++` depending on piece type).

---

## Graduation: Triads → Cats

### Detection

After boops resolve, check **both players'** pieces for any three-in-a-row of consecutive cells in any direction:
- Horizontal (left-to-right)
- Vertical (top-to-bottom)
- Diagonal (↘ and ↙)

A qualifying triad is three consecutive cells all occupied by **the same player's pieces** (any combination of kittens and cats), with **at least one kitten** present. Check the current player first, then the opponent.

> **Pure-cat triads are a win condition, not graduation.** Never trigger the graduation logic when all three cells are cats.

> **Clarification:** If a single turn creates qualifying triads for both players simultaneously, both players must each graduate. Resolve the current player's graduation first, then the opponent's.

### Graduation Process

When a qualifying triad is detected for a player:

1. The player's **kittens within that triad** are highlighted as eligible choices. The player **clicks one kitten** to designate the graduating piece.
2. **All three pieces** in that specific triad are removed from the board:
   - The **chosen kitten** → `catsInReserve + 1` (graduates into a cat in reserve).
   - Each **other kitten** in the triad → `kittensInReserve + 1` (returns to reserve).
   - Each **cat** in the triad → `catsInReserve + 1` (returns to reserve).
3. No piece is placed on the board during graduation. The cat enters reserve and is placed on a future turn.

> **UI requirement:** Highlight all kittens in the qualifying triad(s) as clickable. Clicking a kitten resolves the triad that contains it.

### Multiple Triads

If a player's pieces form more than one qualifying triad simultaneously, **all kittens across all triads** are highlighted as eligible. The player clicks one kitten; only the **single triad containing that kitten** is resolved. All other triads remain on the board unchanged.

### Cats in a Triad

A cat within a qualifying triad participates in graduation normally: it is removed from the board and returned to `catsInReserve`. The player still clicks a **kitten** from the triad to trigger graduation; the cat's presence is what makes the triad qualify as mixed (rather than pure-kitten).

---

## Cats on the Board

Cats behave like kittens in most respects, with two key differences:

1. **Cats cannot be booped by kittens.** (See Booping section.)
2. **Three cats in a row is a win condition**, not a graduation trigger.

Cats can still be booped off the board by other cats. When a cat is pushed off the board, it returns to its owner's `catsInReserve`.

---

## Win Condition

There are two ways to win:

### Win Condition 1 — Three Cats in a Row

A player wins immediately when they have **three of their own cats in a row** (horizontal, vertical, or diagonal) on the board after their turn resolves.

Check after graduation is applied. Check for **both players**.

#### Win Scan

Scan all rows, columns, and diagonals for any three consecutive cells occupied by the same player's cats.

```
Winning lines to check (6×6 board):
  - 6 rows × 4 possible 3-cell windows = 24 horizontal windows
  - 6 cols × 4 possible 3-cell windows = 24 vertical windows
  - 4×4 = 16 diagonal (↘) windows
  - 4×4 = 16 diagonal (↙) windows
  Total: 80 windows to check
```

### Win Condition 2 — Reserve Empty, No Kittens on Board

If at any point the current player has:

- `kittensInReserve == 0`
- `catsInReserve == 0`
- No kittens on the board

...that player wins immediately. This is checked both **mid-turn** (after graduation resolves, before advancing) and at the **start of the next player's turn**.

---

## Edge Cases & Special Rules

### No Available Pieces in Reserve

If a player has `kittensInReserve == 0 && catsInReserve == 0`, they cannot place a piece.

This can happen in two contexts:

**Mid-turn** (after the current player's placement + graduation resolves their reserve to zero):
1. If they have kittens on the board → enter `awaiting_upgrade`: the player selects one of their on-board kittens. That kitten is removed and `catsInReserve + 1`. No boop occurs. Proceed to CHECK_WIN, then advance turn.
2. If they have no kittens on the board → Win Condition 2; current player wins.

**Start of turn** (the incoming player already has an empty reserve):
- Same logic applies before they can place.

> **UI requirement:** Highlight all of the player's on-board kittens as selectable. Status message: "No pieces in reserve — select a kitten to upgrade."

### Upgrade vs Graduation

Both upgrade and graduation remove a kitten from the board and add a cat to `catsInReserve`. The difference:
- **Graduation** is triggered by a 3-in-a-row and removes all three pieces in the matched triad.
- **Upgrade** is triggered by an empty reserve; only one kitten is removed, no triad required.

### Boop Chain Blocking

When the destination cell of a boop is occupied, the booped piece stays in place. There are **no chain boops**: a piece that has been booped does not itself boop other pieces.

### Opponent's Pieces Aligned

If an opponent's pieces form a qualifying triad as a result of the current player's boop, the opponent **does graduate** on that turn. After the current player's graduation (if any) is resolved, check the opponent and prompt them to choose.

---

## Game State Machine

```
            ┌──────────────────────────────────┐
            │              SETUP               │
            └────────────────┬─────────────────┘
                             │ init complete
                             ▼
            ┌──────────────────────────────────┐
       ┌───►│   CHECK: empty reserve at turn   │──── no kittens on board ──► GAME_OVER
       │    │   start? (Win Condition 2)        │
       │    └────────────────┬─────────────────┘
       │        has kittens  │ empty reserve
       │        on board?    ▼
       │    ┌────────────────────────────────┐
       │    │       AWAITING_UPGRADE         │ ← player selects kitten to upgrade
       │    └────────────────┬───────────────┘
       │                     │ or has reserve
       │                     ▼
       │                 PLACE_PIECE
       │                     │
       │                     ▼
       │    ┌──────────────────────────────────┐
       │    │        RESOLVE_BOOPS             │
       │    └────────────────┬─────────────────┘
       │                     │
       │                     ▼
       │    ┌──────────────────────────────────┐
       │    │  CHECK_GRADUATION (both players) │
       │    │  → AWAITING_GRADUATION           │
       │    │    if qualifying triad detected  │
       │    └────────────────┬─────────────────┘
       │                     │
       │                     ▼
       │    ┌──────────────────────────────────┐
       │    │  CHECK_EMPTY_RESERVE (mid-turn)  │──── no kittens on board ──► GAME_OVER
       │    │  for current player              │
       │    └──────┬───────────────┬───────────┘
       │     has   │          empty│ reserve +
       │   reserve │          kittens on board │
       │           │               ▼
       │           │    ┌──────────────────────┐
       │           │    │   AWAITING_UPGRADE   │
       │           │    └──────────┬───────────┘
       │           └──────────────┤
       │                          ▼
       │    ┌──────────────────────────────────┐
       │    │     CHECK_WIN (3 cats in a row)  │
       │    └──────┬─────────────────┬─────────┘
       │           │ no winner       │ winner found
       │           │                 ▼
       │           │    ┌────────────────────────┐
       │           │    │       GAME_OVER        │
       │           │    └────────────────────────┘
       │           │
       │           ▼
       │    ┌──────────────────────────────────┐
       └────┤        ADVANCE_TURN              │
            └──────────────────────────────────┘
```

---

## Suggested UI States

| UI State | Description |
|---|---|
| `playing` | Current player selects an empty cell to place a piece. Highlight valid (empty) cells. |
| `awaiting_graduation` | A qualifying triad has been detected. Highlight all eligible kittens across all qualifying triads; the owning player must click one. Only the triad containing the clicked kitten is resolved. Blocks progression until a choice is made. Can occur for current player, opponent, or both in sequence. |
| `awaiting_upgrade` | Player has no pieces in reserve. Highlight all of their on-board kittens; player must choose one. The kitten is removed and a cat enters their reserve. |
| `game_over` | Highlight the winning three cats in a row (if Win Condition 1). Show winner overlay. |

### Reserve Display

Each player's reserve should display:
- Count of kittens remaining (`kittensInReserve`)
- Count of cats remaining (`catsInReserve`)

The active player's reserve panel is highlighted. During `awaiting_graduation`, the panel of the player who must choose is highlighted instead.

---

## Algorithmic Complexity Notes

- Board is fixed at 6×6 = 36 cells. All scans are O(1) in practice.
- Boop resolution touches at most 8 neighbors per turn.
- Win/graduation scans touch at most 80 windows.
- No dynamic allocation beyond initial setup; the entire game fits in a small flat array.

---

*Spec based on official Boop rules by Smirk & Dagger Games, with implementation-specific rule adaptations. This document reflects the as-built implementation.*
