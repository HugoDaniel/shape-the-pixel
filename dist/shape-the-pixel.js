// Copyright © 2021 by Hugo Daniel Henriques Oliveira Gomes. All rights reserved.
// Licensed under the EUPL v1.2
import { ViewState } from "./state/view-state.js"
import { View } from "./view/shape-the-pixel-view.js"

window.onload = () => {
	if (window.location.hash) {
		console.log(
			"Found an hash",
			window.location.hash,
			"connecting to WebRTC"
		)
	}
	const bounds = {
		w: window.innerWidth,
		h: window.innerHeight,
		dpr: window.devicePixelRatio,
	}
	// const viewState = new ViewState(window.innerWidth, window.innerHeight)
	// const view = new View()
	const viewState = new ViewState(bounds)

	viewState.initIndexedDB()
	window.location.hash = viewState.docId
	const view = new View()
	view.animate()
}
