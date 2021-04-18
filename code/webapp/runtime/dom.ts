import { RuntimeDOMCaps } from "./dom/capabilities.ts";
import { Rects } from "./dom/rects.ts";
import { Device, IDeviceWindow } from "./device.ts";

export class RuntimeDOM {
  /** The current font-size in use */
  readonly fontSize: number;
  /** The available features */
  readonly capabilities: RuntimeDOMCaps;
  /** Device width, height, orientation and DPR */
  readonly device: Device;
  /** Canvas rendering contexts */
  readonly contexts: Map<string, RenderingContext>;
  /** A cache of BoundingRects */
  readonly rects: Rects;
  /**
   * An SVG element, useful to access its namespace features
   * (like matrix calculations etc...)
   */
  readonly svg: SVGElement;
  constructor(w: IDeviceWindow = window) {
    this.fontSize = parseFloat(
      globalThis.getComputedStyle(globalThis.document.documentElement)
        .fontSize || "16px"
    );
    this.device = new Device(w, this.fontSize);
    this.capabilities = new RuntimeDOMCaps();
    this.contexts = new Map();
    this.rects = new Rects();
    this.svg = globalThis.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
  }
}
