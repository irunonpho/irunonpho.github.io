# Boop

Boop is a two-player abstract strategy board game played on a 6×6 grid. You win by lining up three of your **cats** in a row — but getting there requires graduating your kittens first.

## Pieces

- **Kittens** — your starting pieces. Each player has 8.
- **Cats** — the upgraded form. Line up three kittens to graduate them into cats.

## Rules

1. On your turn, place a kitten or cat on any empty square.
2. Placing a piece **boops** (pushes) all adjacent pieces one square outward.
3. Booped pieces that would fall off the board return to your reserve.
4. Line up **three kittens in a row** to graduate them — they leave the board and reappear as cats in your reserve.
5. First player to line up **three cats in a row** wins.

## Strategy

Booping is central to every turn — you can disrupt your opponent's lines while setting up your own. Managing your reserves and timing your cat placements are key to victory.

## Implementation

All game logic runs in React state with no external libraries. The boop mechanic resolves push chains, detects graduating triads, and checks win conditions after every move.
