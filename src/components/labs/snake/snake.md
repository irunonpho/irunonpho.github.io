# Snake

A modern take on the classic Snake arcade game, featuring multiple difficulty levels and a ghost AI opponent that hunts the same food as you.

## How to Play

- Use the **arrow keys** or **WASD** to steer the snake.
- Eat **food** (green) to grow and score points.
- Avoid **poison** (red) — it ends your run immediately.
- Don't collide with the walls or your own tail.

## Ghost AI

A ghost snake appears on the board and competes for the same food. It uses a simple pathfinding strategy powered by A* search algorithm to chase the nearest food while avoiding walls. Beat your high score before the ghost gets there first.

## Implementation

The game loop runs on a `setInterval` tick. Snake state (body segments, direction, score) is managed in React with refs to avoid stale closures in the interval callback. High scores are persisted per difficulty level.
