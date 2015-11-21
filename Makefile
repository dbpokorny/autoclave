.PHONY: clean cleanfs test itertest

LOCBLD=acbuild/js/cache/gh/__local__/__local__
LOCFS=filesys/gh/__local__/__local__

CORE1=token.js table.js tree.js acutil.js
CORE2=$(LOCBLD)/token.js $(LOCBLD)/table.js $(LOCBLD)/tree.js $(LOCBLD)/acutil.js

# does the generated code work and do the same thing as the original?
itertest: $(CORE2) $(LOCFS)/tree.js $(LOCFS)/tmpl/header.js
	node $(LOCBLD)/tree.js tree.js
	diff $(LOCBLD)/tree.js $(LOCFS)/$(LOCBLD)/tree.js

test: $(LOCBLD)/test/mutual_recursion.js

$(LOCBLD)/test/mutual_recursion.js: $(CORE1) test/mutual_recursion.js
	node tree.js test/mutual_recursion.js

README.html: README.md
	ruby -e "require 'github/markup'; puts GitHub::Markup.render('README.md',File.read('README.md'))" > README.html

$(LOCFS)/tree.js: tree.js
	cp tree.js $(LOCFS)/tree.js

$(LOCFS)/tmpl/header.js : tmpl/header.js
	cp tmpl/header.js $(LOCFS)/tmpl/header.js

$(LOCBLD)/token.js: token.js tree.js tmpl/header.js
	node tree.js token.js

$(LOCBLD)/table.js: table.js tree.js tmpl/header.js
	node tree.js table.js

$(LOCBLD)/tree.js: tree.js tmpl/header.js
	node tree.js tree.js

$(LOCBLD)/acutil.js: acutil.js tree.js tmpl/header.js
	node tree.js acutil.js

cleanfs:
	@rm -rf filesys
	@mkdir filesys
	@mkdir filesys/gh
	@mkdir filesys/gh/__local__
	@mkdir filesys/gh/__local__/__local__/
	@mkdir filesys/gh/__local__/__local__/tmpl

clean:
	@rm -rf acbuild
	@mkdir acbuild
	@mkdir acbuild/error
	@mkdir acbuild/html 
	@mkdir acbuild/scope
	@mkdir acbuild/js   
	@rm -f README.html
