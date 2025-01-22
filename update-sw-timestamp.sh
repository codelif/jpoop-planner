#!/usr/bin/bash
sed -i "s/.*jiit-planner-cache.*/$(date +"const CACHE_NAME = 'jiit-planner-cache-v%Y-%m-%d_%H-%M-%S';")/" ./public/sw.js
