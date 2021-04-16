dist/favicon.ico:
	cp code/webapp/favicon.ico dist
dist/shape-the-pixel.css:
	cp code/webapp/shape-the-pixel.css dist
dist/shape-the-pixel.js:
	parcel build code/webapp/shape-the-pixel.js
dist/index.html: dist/shape-the-pixel.js dist/shape-the-pixel.css dist/favicon.ico
	cp code/webapp/index.html dist
serve:
	parcel serve code/webapp/index.html
clean:
	rm -rf dist/*
