readmes := Readme.md $(wildcard */Readme.md)

precommit: toc format

## Format
format: bin.prettier
	@ prettier --print-width 160 --loglevel error --write $(readmes)

## Generate a table of contents
toc: bin.markdown-toc
	@ for readme in $(readmes); do \
			markdown-toc -i $$readme; \
		done;

## Ensure we have the provided command binary in our $PATH
bin.%:
	@ if [ "$$(command -v ${*})" = "" ]; then \
		echo "Required binary \`${*}\` is not found in your \$$PATH."; \
		exit 1; \
	fi