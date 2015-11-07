.PHONY: clean

all: acbuild/js/token.js acbuild/js/table.js acbuild/js/tree.js

README.html: README.md
	ruby -e "require 'github/markup'; puts GitHub::Markup.render('README.md',File.read('README.md'))" > README.html

acbuild/js/token.js: token.js tree.js
	node tree.js token.js

acbuild/js/table.js: table.js tree.js
	node tree.js table.js

acbuild/js/tree.js: tree.js
	node tree.js tree.js

clean:
	@rm -f acbuild/html/*.html
	@rm -f acbuild/scope/*
	@rm -f acbuild/js/*.js
	@rm -f README.html
