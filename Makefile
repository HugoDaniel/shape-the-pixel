build/index.html: web/index.html
	mkdir -p $(dir $@)
	cp web/index.css $(dir $@)
	deno run --allow-read --allow-run --unstable modules/deno_tag/cli.ts $< > $@

clean:
	rm -rf build

serve:
	/usr/bin/python3 -m http.server --directory build & find web/* modules/* | entr -s 'make clean build/index.html ; open -g http://localhost:8000'

stop:
	killall Python