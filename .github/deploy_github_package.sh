#!/bin/sh
echo "Creating publish config for $GITHUB_ACTOR"
npm config set "//npm.pkg.github.com/:_authToken" "$GITHUB_TOKEN"
node -p "JSON.stringify({...require('./package.json'), publishConfig:{registry:'https://npm.pkg.github.com/'}}, null, 2)" > package_tmp1.json
cp package.json package_tmp2.json
cp package_tmp1.json package.json
npm publish -reg "https://npm.pkg.github.com/$GITHUB_ACTOR"
rm -f package_tmp1.json
cp package_tmp2.json package.json
rm -f package_tmp2.json