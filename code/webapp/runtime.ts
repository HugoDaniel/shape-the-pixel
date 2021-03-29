import { IDeviceWindow } from "./runtime/device.ts";
import { RandomArray } from "./runtime/random.ts";
import { RuntimeDOM } from "./runtime/dom.ts";
import { Router } from "./runtime/router.ts";
import { Render } from "./render/render.ts";

export class RuntimeShapeThePixel {
  readonly dom: RuntimeDOM = new RuntimeDOM();
  /** An array of pre-processed random numbers */
  readonly random: RandomArray = new RandomArray();
  readonly render: Render = new Render();
}
