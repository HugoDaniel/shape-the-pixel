// Copyright © 2021 by Hugo Daniel Henriques Oliveira Gomes. All rights reserved.
// Licensed under the EUPL v1.2
const { Y, cuid } = External

/**
 * Model holds all the documents available and keeps track of the list of
 * actions for the current document being edited.
 *
 * Documents are just list of actions.
 **/
export class Model {
	/** The set of available documents to work on */
	docs = []
	/**
	 * The current document id - useful to keep track of it in indexedDB and
	 * WebRTC sessions. In the browser this document id is set in the url hash.
	 */
	id = cuid()
	/**
	 * The document being worked on, this is where all the actions are going
	 * to be applied to.
	 */
	doc = new Y.Doc()
	actions = this.doc.getArray("actions")

	constructor() {
		const ydoc = new Y.Doc()

		// You can define a Y.Array as a top-level type or a nested type

		// Method 1: Define a top-level type
		const yarray = ydoc.getArray("my array type")
		console.log("ARRAY", yarray)

		// Common methods
		yarray.insert(0, [1, 2, 3]) // insert three elements
		yarray.delete(1, 1) // delete second element
		console.log(yarray.toArray()) // => [1, 3]
		yarray.observe(yarrayEvent => {
			yarrayEvent.target === yarray // => true
			console.log("OBSERVING")
			// Find out what changed:
			// Log the Array-Delta Format to calculate the difference to the last observe-event
			console.log(yarrayEvent.changes.delta)
		})

		yarray.insert(0, [1, 2, 3]) // => [{ insert: [1, 2, 3] }]
		yarray.delete(2, 1) // [{ retain: 2 }, { delete: 1 }]

		console.log(yarray.toArray()) // => [1, 2]

		// The delta-format is very useful when multiple changes
		// are performed in a single transaction
		ydoc.transact(() => {
			yarray.insert(1, ["a", "b"])
			yarray.delete(2, 2) // deletes 'b' and 2
		}) // => [{ retain: 1 }, { insert: ['a'] }, { delete: 1 }]

		yarray.push([cuid()])
		yarray.push([cuid()])
		yarray.push([cuid()])
		yarray.insert(4, ["yes", "men"])
		console.log(yarray.toArray()) // => [1, 'a']
	}
}
