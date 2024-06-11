#!/bin/bash

export LIBRARY_PATH=/usr/lib/gcc/x86_64-linux-gnu/11/:/usr/lib/gcc/x86_64-linux-gnu/11/../../../x86_64-linux-gnu/:/usr/lib/gcc/x86_64-linux-gnu/11/../../../../lib/:/lib/x86_64-linux-gnu/:/lib/../lib/:/usr/lib/x86_64-linux-gnu/:/usr/lib/../lib/:/usr/lib/gcc/x86_64-linux-gnu/11/../../../:/lib/:/usr/lib/

if command -v python &> /dev/null; then
    python test/main.py
elif command -v python3 &> /dev/null; then
    python3 test/main.py
else
    echo "Error: Python interpreter not found! Make sure you have Python 3 installed"
    exit 1
fi
