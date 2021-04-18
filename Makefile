dist/state:
	cp -R code/webapp/state dist
dist/shape-the-pixel.js:
	cp code/webapp/shape-the-pixel.js dist
dist/favicon.ico:
	cp code/webapp/favicon.ico dist
dist/shape-the-pixel.css:
	cp code/webapp/shape-the-pixel.css dist
dist/dependencies/bundle.js:
	mkdir -p dist/dependencies
	cp code/webapp/dependencies/bundle.js dist/dependencies
dist/dependencies/shader_canvas.js:
	mkdir -p dist/dependencies
	cp code/webapp/dependencies/shader_canvas.js dist/dependencies
dist/dependencies.js:
	parcel build code/webapp/dependencies.js
dist/render:
	mkdir -p dist/render
	cp code/webapp/render/* dist/render
dist/index.html: dist/render dist/state dist/shape-the-pixel.js dist/dependencies.js dist/shape-the-pixel.css dist/favicon.ico dist/dependencies/bundle.js dist/dependencies/shader_canvas.js
	cp code/webapp/index.html dist
serve:
	parcel serve code/webapp/index.html
clean:
	rm -rf dist/*
all: clean dist/index.html
