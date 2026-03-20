#!/bin/bash
echo "Stopping all MFE services..."

ports=(3000 3001 3002 3003 3004 3005 3006)

for port in "${ports[@]}"
do
    pid=$(lsof -t -i:$port)
    if [ -n "$pid" ]; then
        echo "Killing process $pid on port $port..."
        kill -9 $pid
    fi
done

echo "Done."
