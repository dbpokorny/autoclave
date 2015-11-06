.PHONY: clean

all: build/XXtoken.js build/XXtable.js build/XXtree.js

README.html: README.md
	ruby -e "require 'github/markup'; puts GitHub::Markup.render('README.md',File.read('README.md'))" > README.html

build/XXtoken.js: token.js tree.js
	node tree.js token.js

build/XXtable.js: table.js tree.js
	node tree.js table.js

build/XXtree.js: tree.js
	node tree.js tree.js

clean:
	@rm -f build/*.html
	@rm -f build/*.scope
	@rm -f build/XX*.js
	@rm -f README.html
