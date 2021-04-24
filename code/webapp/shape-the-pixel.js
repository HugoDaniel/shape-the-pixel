// Copyright © 2021 by Hugo Daniel Henriques Oliveira Gomes. All rights reserved.
// Licensed under the EUPL v1.2
import { ViewState } from "./state/view-state.js"
import { View } from "./view/shape-the-pixel-view.js"
const { cuid } = External

window.onload = () => {
	let id = cuid()
	if (window.location.hash) {
		console.log("Found an hash", window.location.hash)
		let id = window.location.hash
	} else {
		console.log("Setting room hash", id)
		window.location.hash = id
	}
	const bounds = {
		w: window.innerWidth,
		h: window.innerHeight,
		dpr: window.devicePixelRatio,
	}
	const viewState = new ViewState(bounds, id)
	viewState.initIndexedDB()

	const view = new View()
	view.animate()
}
