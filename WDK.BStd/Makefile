#

COMPILE 	= cat
#COMPILE         = java -jar compiler.jar
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

$(DISTPATH)/bstd-web.js: ./source/bstd.js ./source/webbase.js
	cat ./source/bstd.js ./source/webbase.js|$(COMPILE)>$(DISTPATH)/bstd-web.js

$(DISTPATH)/bstd-node.js: ./source/bstd.js
	$(COMPILE) ./source/bstd.js>$(DISTPATH)/bstd-node.js
