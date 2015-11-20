.PHONY: clean cleanfs

LOC=acbuild/js/cache/gh/__local__/__local__

CORE1=token.js table.js tree.js acutil.js
CORE2=$(LOC)/token.js $(LOC)/table.js $(LOC)/tree.js $(LOC)/acutil.js

# does the generated code work?
itertest: $(CORE2)
	node acbuild/js/cache/gh/__local__/__local__/tree.js tree.js

test: $(LOC)/test/mutual_recursion.js

$(LOC)/test/mutual_recursion.js: $(CORE1) test/mutual_recursion.js
	node tree.js test/mutual_recursion.js

README.html: README.md
	ruby -e "require 'github/markup'; puts GitHub::Markup.render('README.md',File.read('README.md'))" > README.html

$(LOC)/token.js: token.js tree.js tmpl/header.js
	node tree.js token.js

$(LOC)/table.js: table.js tree.js tmpl/header.js
	node tree.js table.js

$(LOC)/tree.js: tree.js tmpl/header.js
	node tree.js tree.js

$(LOC)/acutil.js: acutil.js tree.js tmpl/header.js
	node tree.js acutil.js

clean:
	@rm -rf acbuild
	@mkdir acbuild
	@mkdir acbuild/error
	@mkdir acbuild/html 
	@mkdir acbuild/scope
	@mkdir acbuild/js   
	@rm -f README.html
