# Wave 2 Peergos app
.PHONY: test certify
test:
	node tests/lib.test.mjs
	@test -f assets/sdk.js
	@test -f assets/index.html
	@test -f peergos-app.json
certify: test
	bash tests/certify-peergos.sh
