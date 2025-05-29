#!/bin/bash
export PATH="$HOME/.deno/bin:$PATH"
cd lume-site && deno task build
