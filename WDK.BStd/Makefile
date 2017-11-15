#

#COMPILE 	= cat
COMPILE   = java -jar googlecompile/compiler.jar
DISTPATH	= dist

.PHONY: help web node clean

help:
	@echo "Choose your build target:"
	@echo "web   -   make for web uses"
	@echo "node  -   make for node.js uses"

web: $(DISTPATH) $(DISTPATH)/bstd-web.js

node: $(DISTPATH) $(DISTPATH)/bstd-node.js

clean:
	rm -f $(DISTPATH)/bstd-web.js
	rm -f $(DISTPATH)/bstd-node.js

$(DISTPATH):
	mkdir $(DISTPATH)

$(DISTPATH)/bstd-web.js: ./source/mio-sys.js ./source/mio-dom.js ./source/mio-check.js ./source/mio-ajax.js
	cat ./source/mio-sys.js ./source/mio-dom.js ./source/mio-check.js ./source/mio-ajax.js|$(COMPILE)>$(DISTPATH)/bstd-web.js

$(DISTPATH)/bstd-node.js: ./source/mio-sys.js
	$(COMPILE) ./source/bstd.js>$(DISTPATH)/bstd-node.js
