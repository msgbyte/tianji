.PHONY: lint test vendor clean

export GO111MODULE=on

default: lint test

test:
	go test -v -cover ./...

yaegi_test:
	yaegi test -v .

vendor:
	go mod vendor

clean:
	rm -rf ./vendor