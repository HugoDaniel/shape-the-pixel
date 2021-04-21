import cuid from "cuid"
import * as Y from "yjs"
import { IndexeddbPersistence } from "y-indexeddb"
import { WebrtcProvider } from "y-webrtc"
import * as THREE from "three"

globalThis.External = {
	cuid,
	Y,
	IndexeddbPersistence,
	WebrtcProvider,
	THREE,
}
