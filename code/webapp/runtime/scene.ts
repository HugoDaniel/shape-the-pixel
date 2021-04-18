import { Map2D } from "https://deno.land/x/simple_shape_math@v1.0.0/containers2d.ts";

/**
 * Scene class represents the runtime app state being displayed.
 *
 * It holds the current grid positions and values that get read by the
 * Render at each frame.
 */
export class Scene {
  grid = new Map2D(
    [
      [0, 0],
      [1, 1],
      [1, 2],
      [-1, -1],
      [2, 2],
      [5, 2],
      [5, 0],
      [10, 2],
      [31, 2],
      [0, 29],
    ],
    [5, 1, 2, 3, 4, 1, 3, 2, 5, 5]
  );
}
