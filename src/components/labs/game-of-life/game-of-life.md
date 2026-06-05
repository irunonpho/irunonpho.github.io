# Game of Life

Conway's Game of Life is a zero-player cellular automaton devised by mathematician John Horton Conway in 1970. Despite having only four simple rules, it produces remarkably complex and unpredictable patterns.

## Rules

Each cell on the grid is either **alive** or **dead**, and each generation is determined by its eight neighbours:

1. A live cell with **2 or 3** live neighbours survives.
2. A live cell with **fewer than 2** live neighbours dies (underpopulation).
3. A live cell with **more than 3** live neighbours dies (overpopulation).
4. A dead cell with **exactly 3** live neighbours becomes alive (reproduction).

## How to Play

- Click any cell to toggle it alive or dead.
- Hit **Play** to watch the colony evolve generation by generation.
- Use **Step** to advance one generation at a time.
- **Random** seeds the grid with a ~38% live-cell density.
- Adjust the **Speed** slider to control the simulation rate.

## Implementation

The simulation runs entirely in the browser using React state. Each generation is computed by mapping over the 20×20 grid and applying the four rules to every cell simultaneously — no mutation, just a fresh array each tick.
