// Copyright © 2021 by Hugo Daniel Henriques Oliveira Gomes. All rights reserved.
// Licensed under the EUPL v1.2
import { Model } from "./model.js"

const { IndexeddbPersistence } = External
export class ViewState {
	/**
	 * The IndexedDBProvider is used to keep a local copy of the current model
	 * document. It is only active at runtime during actual browser usage. This
	 * allows tests to happen in the CLI, because the IndexedDBProvider is only
	 * initialized when the 'initIndexedDB()' function is called when the document
	 * is loaded at the 'shape-the-pixel.js' file.
	 **/
	indexeddbProvider = undefined
	get docId() {
		return this.model.id
	}
	constructor(bounds, roomId) {
		this.bounds = bounds
		this.model = new Model(roomId)
	}

	/**
	 * Places the current model document in the IndexedDB persistent browser
	 * storage. This is called by the 'shape-the-pixel.js' file when the document
	 * is loaded.
	 **/
	initIndexedDB() {
		// this instantly gets the (cached) documents data
		this.indexeddbProvider = new IndexeddbPersistence(
			this.model.id,
			this.model.doc
		)
		this.indexeddbProvider.whenSynced.then(() => {
			console.log("loaded data from indexed db")
		})
	}
}

/**
 * A JSON serializable object that is sent to be rendered.
 *
 * This should have all the needed information for the renderer to produce a
 * useful output.
 *
 * It includes the latest actions performed.
 */
export class ViewObject {}
