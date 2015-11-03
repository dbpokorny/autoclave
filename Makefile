.PHONY: clean

README.html: README.md
	ruby -e "require 'github/markup'; puts GitHub::Markup.render('README.md',File.read('README.md'))" > README.html

clean:
	@rm -f build/token.html
	@rm -f build/table.html
	@rm -f build/scope.html
	@rm -f build/tree.html
	@rm -f README.html
