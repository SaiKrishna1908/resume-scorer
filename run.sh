#!/bin/bash
npx tsx src/index.ts "$@" && node scripts/create-resume.js "$@"