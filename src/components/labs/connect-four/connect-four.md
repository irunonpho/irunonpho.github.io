# Connect Four

A classic two-player strategy game where the goal is to be the first to connect four of your pieces in a row — horizontally, vertically, or diagonally.

## How to Play

- Click any column to drop your piece into it.
- Pieces fall to the lowest available row.
- First player to align **four in a row** wins.
- Play against another person locally, or challenge the AI.

## AI Opponent

The AI uses the **minimax algorithm** with alpha-beta pruning to look several moves ahead and choose the best possible response. The evaluation function scores board positions based on connected piece counts and center-column control.

## Implementation

The board is represented as a 6×7 grid of cell states. Win detection checks all possible four-cell windows (horizontal, vertical, and both diagonals) after every move. The AI runs synchronously in the browser — no server required.
