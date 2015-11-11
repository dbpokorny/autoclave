.PHONY: clean

LOC=acbuild/js/cache/gh/__local__/__local__

local: $(LOC)/token.js $(LOC)/table.js $(LOC)/tree.js $(LOC)/hello.js

README.html: README.md
	ruby -e "require 'github/markup'; puts GitHub::Markup.render('README.md',File.read('README.md'))" > README.html

$(LOC)/token.js: token.js tree.js
	node tree.js token.js

$(LOC)/table.js: table.js tree.js
	node tree.js table.js

$(LOC)/tree.js: tree.js
	node tree.js tree.js

$(LOC)/hello.js: tree.js hello.js
	node tree.js hello.js

clean:
	@rm -rf acbuild
	@mkdir acbuild
	@mkdir acbuild/error
	@mkdir acbuild/html 
	@mkdir acbuild/scope
	@mkdir acbuild/js   
	@rm -f  README.html
