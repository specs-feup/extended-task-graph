#!/bin/bash

if command -v python &> /dev/null; then
    python test/main.py
elif command -v python3 &> /dev/null; then
    python3 test/main.py
else
    echo "Error: Python interpreter not found! Make sure you have Python 3 installed"
    exit 1
fi
