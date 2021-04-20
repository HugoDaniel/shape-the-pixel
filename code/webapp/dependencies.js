import cuid from "cuid"
import * as Y from "yjs"
import { IndexeddbPersistence } from "y-indexeddb"
import { WebrtcProvider } from "y-webrtc"
import interact from "interactjs"

globalThis.External = {
	cuid,
	Y,
	IndexeddbPersistence,
	WebrtcProvider,
	interact,
}
