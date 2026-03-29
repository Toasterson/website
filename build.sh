#!/bin/bash
export PATH="$HOME/.deno/bin:$HOME/.local/share/mise/shims:$PATH"
deno task build
