test:
	npm build

test-coveralls:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	$(MAKE) test
	@NODE_ENV=test cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js || true
