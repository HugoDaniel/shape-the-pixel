import { ShaderCanvas } from "../../../dependencies/shader_canvas/shader_canvas.ts";
import { PanZoom2D } from "./pan_zoom_2d.ts";
import { RenderGrid } from "./grid.ts";
import { Map2D } from "https://deno.land/x/simple_shape_math@v1.0.0/containers2d.ts";

export class Render {
  shaderCanvasElem: ShaderCanvas;
  panZoom2D = new PanZoom2D();
  grid = new RenderGrid();

  constructor() {
    const elem = globalThis.document.querySelector("shader-canvas");
    if (!elem) {
      console.error("Render: <shader-canvas> not found");
      throw new Error("<shader-canvas> not found");
    }
    if (elem instanceof ShaderCanvas) {
      this.shaderCanvasElem = elem;
    } else {
      console.error(
        "Render: <shader-canvas> found but is not an instance of ShaderCanvas"
      );
      throw new Error("<shader-canvas> not an instance of ShaderCanvas");
    }
  }

  async start() {
    this.panZoom2D.initialize({ dpr: window.devicePixelRatio });
    this.panZoom2D.startEventListeners();
    this.grid.initialize({
      dpr: window.devicePixelRatio,
      w: window.innerWidth * window.devicePixelRatio,
      h: window.innerHeight * window.devicePixelRatio,
      gridFillIds: new Map2D(),
    });
    await this.shaderCanvasElem.initialize();
    this.shaderCanvasElem.draw();
  }
}
