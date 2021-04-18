import cuid from "cuid"
import * as Y from "yjs"
import * as PIXI from "pixi.js"
import { IndexeddbPersistence } from "y-indexeddb"
import { WebrtcProvider } from "y-webrtc"

globalThis.External = {
	cuid,
	Y,
	PIXI,
	IndexeddbPersistence,
	WebrtcProvider,
}
