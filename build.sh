#!/bin/bash

echo
echo "> > > BUILDING < < <"
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo
echo "> > > CD INTO src/server < < <"
cd src/server

echo 
echo "> > > MIGRATIN DB < < <"
pnpm db:migrate:apply

echo
echo "> > > DELETING OLD PM2 < < <"
pm2 del tianji

echo 
echo "> > > STARTING PM2 < < <"
pm2 start ./dist/src/server/main.js --name tianji -f