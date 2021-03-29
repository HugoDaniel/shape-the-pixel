import { RuntimeShapeThePixel } from "./runtime.ts";
globalThis.document.addEventListener("DOMContentLoaded", () => {
  const runtime = new RuntimeShapeThePixel();
  runtime.render.start();
});
