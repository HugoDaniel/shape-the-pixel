build/index.html: code/webapp/index.html
	mkdir -p $(dir $@)
	mkdir -p $(dir $@)css
	cp code/webapp/css/* $(dir $@)css
	deno run --allow-read --allow-run --unstable https://deno.land/x/deno_tag@v1.1.0/deno_tag.ts $< > $@

init:
	git submodule init
	git submodule update
	cd dependencies/yjs/ && npm i
	cd dependencies/yjs/ && npm run dist

update:
	git submodule foreach git pull origin main

clean:
	rm -rf build

serve:
	/usr/bin/python3 -m http.server --directory build & find code/* | entr -s 'make clean build/index.html ; open -g http://localhost:8000'

stop:
	killall Python
