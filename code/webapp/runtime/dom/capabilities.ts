/** DOM Capabilities: It determines if something is available in the DOM or not */
export class RuntimeDOMCaps {
  readonly hasSystemColorPicker: boolean;
  readonly hasWebGL2: boolean;
  // ^ is there support for <input type=color ?
  constructor() {
    this.hasSystemColorPicker = RuntimeDOMCaps.hasSystemColorPicker();
    this.hasWebGL2 = RuntimeDOMCaps.hasWebGL2();
  }
  /** This function checks if there is support for <input type="color"> */
  static hasSystemColorPicker(): boolean {
    const i = globalThis.document.createElement("input");
    i.setAttribute("type", "color");
    return i.type !== "text";
  }
  /** This function checks if WebGL is supported */
  static hasWebGL2(): boolean {
    try {
      const canvas = globalThis.document.createElement("canvas");
      return Boolean(
        !!window.WebGL2RenderingContext && canvas.getContext("webgl2")
      );
    } catch (e) {
      return false;
    }
  }
}
