#!/bin/sh

# Start Tianji server in background
pnpm start:docker &

# Wait a moment for server to start
sleep 10

# Start reporter with default workspace
/usr/local/bin/tianji-reporter --url "http://localhost:12345" --workspace "clnzoxcy10001vy2ohi4obbi0" --name "tianji-container" --silent > /dev/null &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
