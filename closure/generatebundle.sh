#!/bin/bash

ROOT_DIR=$(readlink -f $(dirname $0))

$ROOT_DIR/closure-library/closure/bin/calcdeps.py -i $ROOT_DIR/data/deps.js -p $ROOT_DIR/closure-library -o script --output_file=/tmp/bundle.js

sed 's,var goog =.*,,g' /tmp/bundle.js > /tmp/bundle2.js

cat <<EOF > bundle.js
__setupPackage__("goog");

$(cat /tmp/bundle2.js)
EOF
