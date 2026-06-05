# Boop

Boop is a two-player abstract strategy board game played on a 6×6 grid. You win by lining up three of your **cats** in a row — but getting there requires graduating your kittens first.

## Pieces

- **Kittens** — your starting pieces. Each player has 8.
- **Cats** — the upgraded form. Graduate three kittens to earn cats.

## Rules

1. On your turn, place a kitten or cat on any empty square.
2. Placing a piece **boops** (pushes) all adjacent pieces one square outward.
3. Booped pieces that would fall off the board return to your reserve.
4. Line up **three kittens in a row** to trigger graduation — click the highlighted triad to graduate all three into cats.
5. First player to line up **three cats in a row** wins — or place all **8 cats** on the board at once.

## Empty Reserve

If your reserve runs out while you still have pieces on the board, you must retrieve one before playing again:

- **Select a kitten** — it upgrades and returns to your reserve as a cat.
- **Select a cat** — it returns to your reserve as-is, no upgrade.

## Strategy

Booping is central to every turn — you can disrupt your opponent's lines while setting up your own. Managing your reserves and timing your cat placements are key to victory.

## Implementation

All game logic runs in React state with no external libraries. The boop mechanic resolves push chains, detects graduating triads, and checks win conditions after every move.
