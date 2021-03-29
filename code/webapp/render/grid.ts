import { ShaderCanvas } from "../../../dependencies/shader_canvas/shader_canvas.ts";
import type { DrawVAO } from "../../../dependencies/shader_canvas/core/draw_calls/draw_vao.ts";
import { DrawCalls } from "../../../dependencies/shader_canvas/core/draw_calls/draw_calls.ts";
import { DrawLoop } from "../../../dependencies/shader_canvas/core/draw_calls/draw_loop.ts";
import type { WebGLBuffers } from "../../../dependencies/shader_canvas/core/webgl_buffers/webgl_buffers.ts";
import { ShaderCanvasContainer } from "../../../dependencies/shader_canvas/core/shader_canvas/shader_canvas_container.ts";
import { ReadPixels } from "../../../dependencies/shader_canvas/core/draw_calls/read_pixels.ts";
import type { CreateBuffer } from "../../../dependencies/shader_canvas/core/webgl_buffers/create_buffer.ts";
import { PanZoomState } from "./pan_zoom_2d.ts";
import { ortho } from "https://deno.land/x/simple_shape_math@v1.0.0/matrix.ts";
import { Map2D } from "https://deno.land/x/simple_shape_math@v1.0.0/containers2d.ts";

/**
 * RenderGrid is the class responsible to render a 2D grid.
 * It receives the reference to a Map2D with the positions and fill id's
 * and uses it to render an infinite grid.
 */
export class RenderGrid {
  /**
   * In pixels - minimum size possible of a grid cell when zoomed out
   * completely.
   */
  size = 12;

  /**
   * The size (in pixels), adjusted to the current device pixel ratio
   * This is calculated in `reset()`.
   */
  dprSize = this.size;

  /**
   * Number of extra squares beyond the visible canvas. Useful to avoid showing
   * the edges when panning/zooming the infinite grid.
   **/
  padding = 2;
  /**
   * Number of grid cells to render. I.e. if this is a square grid, this
   * var represents the maximum number of squares in the screen at any given
   * moment (the number of visible items when zooming out to the max).
   */
  instances = 0;

  /** This array contains each of the grid cell coordinates
   * (in relation to the scene origin) and the fill id for it.
   *
   * It is passed to WebGL.
   **/
  instanceScene = new Int16Array(this.instances * 3);
  /**
   * The number of columns in this grid that the current window can display.
   */
  cols = 0;

  /**
   * Buffers get refreshed when this variable is true. Buffers need to be
   * refreshed with the new cell scene coordinates when the scene is being
   * panned/zoomed. This is a somewhat expensive operation that happens per
   * frame, and this flag is helpful to trigger that operation only when
   * needed.
   */
  private needsSceneUpdate = true;
  /**
   * The previous X coordinate movement difference.
   */
  private oldSceneDeltaX = 0;
  /**
   * The previous Y coordinate movement difference.
   */
  private oldSceneDeltaY = 0;
  /**
   * The previous zoom difference.
   */
  private oldScaledSize = 1;

  /**
   * The X grid coordinate for the grid cursor. Represents the grid element
   * that is being hovered with the mouse.
   **/
  hoverX: number | undefined = undefined;
  /**
   * The Y grid coordinate for the grid cursor. Represents the grid element
   * that is being hovered with the mouse.
   **/
  hoverY: number | undefined = undefined;
  /**
   * The data read by the multiple render targets fragment shader output when
   * "picking" a grid element. This is an ivec4 where each position is a Int32.
   */
  readData = new Uint32Array();
  /**
   * The <read-pixels> element. This is used to trigger the fence/sync action
   * associated with reading a WebGL shader output.
   */
  pixels: ReadPixels | null = null;

  /**
   * Recalculates all values with the provided dimensions.
   */
  reset(
    w = window.innerWidth * window.devicePixelRatio,
    h = window.innerHeight * window.devicePixelRatio,
    dpr = window.devicePixelRatio
  ) {
    const horizontalSquares = Math.ceil(w / dpr / this.size) + this.padding;
    const verticalSquares = Math.ceil(h / dpr / this.size) + this.padding;
    this.instances = horizontalSquares * verticalSquares;
    this.instanceScene = new Int16Array(this.instances * 3);
    this.cols = Math.ceil(w / (this.size * dpr)) + this.padding;
    this.dprSize = this.size * dpr;

    this.readData = new Uint32Array(w * h * 4);
  }

  /**
   * Resets all variables to their initial values, appends the <draw-loop>
   * to the ShaderCanvas tag, and initializes the WebGL buffers and programs
   * needed for drawing the grid.
   */
  initialize({
    dpr,
    w,
    h,
    gridFillIds,
  }: {
    dpr: number;
    w: number;
    h: number;
    gridFillIds: Map2D<number>;
  }) {
    this.reset(w, h, dpr);
    this.appendDrawLoop();
    this.initializeBuffers(gridFillIds);
    this.initializeProgram(w, h, dpr);

    globalThis.document.addEventListener("pointerdown", (e) => {
      this.needsSceneUpdate = true;
      if (this.hoverX && this.hoverY) {
        appState.setXY(this.hoverX, this.hoverY, 3);
      }
    });
  }

  private appendDrawLoop() {
    const drawCalls = globalThis.document.querySelector("draw-calls");
    if (!(drawCalls instanceof DrawCalls)) {
      console.error("Could not get an instance of DrawCalls");
      return;
    }
    const drawLoop = new DrawLoop();
    if (!(drawLoop instanceof globalThis.HTMLElement)) {
      console.error("Could not create a DrawLoop HTMLElement instance");
      return;
    }
    drawLoop.setAttribute("name", "grid");
    drawLoop.innerHTML = RenderGrid.drawLoopHTML(this.instances);
    this.pixels = drawLoop.querySelector("read-pixels");
    drawCalls.append(drawLoop);
  }
  /**
   * Fill the `instanceScene` Int16Array attribute. Each vertex will be
   * supplied with a vec3(gridElementX, gridElementY, fillId). This vec3 is
   * prepared here according to the actual pan and zoom on the scene and
   * sent to the GPU by STREAM_DRAW'ing it to the buffer.
   *
   * @param gl WebGL context
   * @param buffer The buffer to stream the grid element positions
   * @param transforms The current [panX, panY, zoom] being applied to the scene
   * @param gridFillIds A Map2D with all the fillIds available per coordinate
   */
  private fillInstanceScene(
    gl: WebGL2RenderingContext,
    buffer: CreateBuffer | undefined,
    transforms: [number, number, number],
    gridFillIds: Map2D<number>
  ) {
    if (!buffer) {
      console.warn("Unable to fill instance scene - buffer is undefined");
      return;
    }

    // Get the scale (transforms[2]) and apply it to the size of a grid element
    const scaledSize = this.dprSize * transforms[2];
    // sceneDeltaX/Y is the amount of grid elements that the scene is shifted
    // from the origin element (the "square" at (0, 0)).
    const sceneDeltaX =
      Math.floor(transforms[0] / scaledSize) + this.padding / 2;
    const sceneDeltaY =
      Math.floor(transforms[1] / scaledSize) + this.padding / 2;

    // Only fill the buffer if necessary
    if (
      !this.needsSceneUpdate &&
      this.oldSceneDeltaX === sceneDeltaX &&
      this.oldSceneDeltaY === sceneDeltaY &&
      this.oldScaledSize == scaledSize
    ) {
      return;
    }
    // Calculate the scene coordinates for each grid element, and get their fill
    // reference from the argument "gridFillIds"
    for (let i = 0; i < this.instances; i++) {
      // The current grid element (x,y) coordinates (in grid positions).
      const sceneX = Math.floor((i % this.cols) - sceneDeltaX);
      const sceneY = Math.floor(Math.abs(i / this.cols) - sceneDeltaY);
      // Set the array to be streamed in the webgl buffer.
      // This will be available per pixel - each pixel will get its own
      // vec3(sceneX, sceneY, fillID)
      this.instanceScene[3 * i + 0] = sceneX;
      this.instanceScene[3 * i + 1] = sceneY;
      this.instanceScene[3 * i + 2] = gridFillIds.getXY(sceneX, sceneY) || 0;
    }
    // Store the current coordinates in order to update the scene again only
    // if they change
    this.oldSceneDeltaX = sceneDeltaX;
    this.oldSceneDeltaY = sceneDeltaY;
    this.oldScaledSize = scaledSize;

    // Send everything to the GPU
    buffer.bindBuffer();
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceScene, gl.STREAM_DRAW);
  }

  private initializeBuffers(gridFillIds: Map2D<number>) {
    ShaderCanvas.initializeBuffers(
      (gl: WebGL2RenderingContext, buffers: WebGLBuffers) => {
        if (!(buffers instanceof ShaderCanvasContainer)) {
          console.error(
            "Buffers passed are not an instance of ShaderCanvasContainer"
          );
          return;
        }
        const dataBuffers = [buffers.content.get("quad-instance-scene")];
        const state = ShaderCanvas.getModuleState("pan-zoom-2d");
        if (!PanZoomState.isPanZoomState(state)) {
          console.warn("Unable to get the state for the 'pan-zoom-2d' module");
          return;
        }
        // Initialize the scene buffers.
        this.fillInstanceScene(gl, dataBuffers[0], state.originAt, gridFillIds);
        // The following function will be run per frame:
        return () => {
          if (
            !state ||
            !state.matrix ||
            !state.originAt ||
            !(state.matrix instanceof Float32Array) ||
            !(state.originAt instanceof Array)
          ) {
            console.warn('Invalid "pan-zoom-2d" module state in grid buffers');
            return;
          }
          if (state.isUpdating || this.needsSceneUpdate) {
            this.fillInstanceScene(
              gl,
              dataBuffers[0],
              state.originAt,
              gridFillIds
            );
            this.needsSceneUpdate = false;
          }
          // colorId = Math.floor(Math.random() * 4) + 1;
        };
      }
    );
  }

  private initializeProgram(
    w = window.innerWidth,
    h = window.innerHeight,
    dpr = window.devicePixelRatio
  ) {
    const p = ShaderCanvas.createProgram(
      (gl: WebGL2RenderingContext, { uniformLocations }) => {
        let oldHoverX = this.hoverX;
        let oldHoverY = this.hoverY;
        const hoverLoc = uniformLocations.get("hover");
        const projectionLoc = uniformLocations.get("projection");
        if (!projectionLoc) {
          console.error("Unable to find the 'projection' GLSL location");
          return;
        }
        const sizeLoc = uniformLocations.get("size");
        if (!sizeLoc) {
          console.error("Unable to find the 'size' GLSL location");
          return;
        }
        gl.uniformMatrix4fv(
          projectionLoc,
          false,
          ortho({
            left: 0,
            right: gl.drawingBufferWidth,
            bottom: gl.drawingBufferHeight,
            top: 0,
            near: 0,
            far: 1,
          })
        );
        gl.uniform1f(sizeLoc, this.dprSize);
        const panZoomObj = ShaderCanvas.getModuleState("pan-zoom-2d");
        if (
          !(panZoomObj instanceof PanZoomState) ||
          !(this.pixels instanceof ReadPixels)
        ) {
          return;
        }
        panZoomObj.onActionEnd = () => {
          this.pixels?.getPixels(this.readData);
        };

        const view = new DataView(this.readData.buffer);
        globalThis.document.addEventListener(
          "pointermove",
          (e) => {
            e.preventDefault();
            const mouseX = Math.floor(e.offsetX * dpr);
            const mouseY = h - Math.floor(e.offsetY * dpr);
            const bytesPerItem = 4; // Its a Uint32 array
            const itemsPerPixel = 4; // WebGL writes/fetches a vec4 by default
            const bytesPerPixel = itemsPerPixel * bytesPerItem;

            const arrayPos =
              mouseY * (w * bytesPerPixel) + mouseX * bytesPerPixel;
            this.hoverX = view.getInt32(arrayPos, true);
            this.hoverY = view.getInt32(arrayPos + 4, true); // arrayPos++
          },
          { passive: false }
        );

        return () => {
          if (
            (this.hoverX !== oldHoverX || this.hoverY !== oldHoverY) &&
            hoverLoc &&
            this.hoverX !== undefined &&
            this.hoverY !== undefined
          ) {
            gl.uniform3i(hoverLoc, this.hoverX, this.hoverY, 3);
            oldHoverX = this.hoverX;
            oldHoverY = this.hoverY;
          }
        };
      }
    );

    p.useWith("infinite-grid");
  }

  /**
   * Creates the HTML for the <draw-loop> to draw a grid.
   * This is going to injected in ShaderCanvas
   **/
  static drawLoopHTML = (instanceNumber: number) => `\
    <bind-framebuffer src="elements-grid">
        <draw-buffers buffers=["COLOR_ATTACHMENT0","COLOR_ATTACHMENT1"]></draw-buffers>
        <viewport-transform x="0" y="0"></viewport-transform>
        <depth-func func="LEQUAL"></depth-func>
        <clear-flags mask="COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT"></clear-flags>
        <use-program src="infinite-grid">
            <uniform-1fv var="isLines" value="0"></uniform-1fv>
            <draw-vao instanceCount=${instanceNumber} src="quad-vao" mode="TRIANGLE_FAN" count="4" type="UNSIGNED_SHORT">
            </draw-vao>
            <uniform-1fv var="isLines" value="1"></uniform-1fv>
            <draw-vao instanceCount=${instanceNumber} src="quad-vao" mode="LINE_STRIP" count="4" type="UNSIGNED_SHORT">
            </draw-vao>
        </use-program>
        <read-buffer src="COLOR_ATTACHMENT1"></read-buffer>
        <read-pixels dest="position-picker-pack" type="INT" format="RGBA_INTEGER"></read-pixels>
    </bind-framebuffer>
    <depth-func func="LEQUAL"></depth-func>
    <viewport-transform x="0" y="0"></viewport-transform>
    <use-program src="full-screen-quad">
        <active-texture var="screenTexture" src="color-texture-target"></active-texture>
        <draw-vao src="screen-vao" count="6"></draw-vao>
    </use-program>
`;
}

////////////////////
// APP STATE MOCK //
////////////////////
const appState = new Map2D(
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
