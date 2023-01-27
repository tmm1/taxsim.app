default: public/taxsim.js public/taxsim.wasm

public:
	mkdir -p public

public/taxsim.js: public
	curl -o public/taxsim.js https://taxsim.nber.org/taxsim35/taxsim.js

public/taxsim.wasm: public
	curl -o public/taxsim.wasm https://taxsim.nber.org/taxsim35/taxsim.wasm

update:
	rm -f public/taxsim.*
	make

.PHONY: default
