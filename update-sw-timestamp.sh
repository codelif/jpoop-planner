#!/usr/bin/bash
ROOTDIR=$(dirname "$(readlink -f "$0")")
sed -i "s/.*jiit-planner-cache.*/$(date +"const CACHE_NAME = 'jiit-planner-cache-v%Y-%m-%d_%H-%M-%S';")/" "$ROOTDIR/public/sw.js"
sed -i "s/    const currentVersion = '[^']*'/$(date +"    const currentVersion = 'jiit-planner-cache-v%Y-%m-%d_%H-%M-%S'")/" "$ROOTDIR/app/page.js"

if [ "$1" = "-c" ]; then
  git add .
  git commit -m "chore: update sw cache"
fi
