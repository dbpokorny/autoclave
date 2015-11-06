.PHONY: clean

README.html: README.md
	ruby -e "require 'github/markup'; puts GitHub::Markup.render('README.md',File.read('README.md'))" > README.html

clean:
	@rm -f build/*.html
	@rm -f build/*.scope
	@rm -f README.html
