#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -lt 1 ] || [ "$#" -gt 3 ]; then
    echo "Usage: $0 <symbols> [repetitions] [source_folder]"
    exit 1
fi

filename=$1
repetitions=${2:-10}  # Set default value to 10 if not provided
source_folder=${3:-.}  # Set default value to the current directory if not provided

# Check if the file exists
if [ ! -e "$filename" ]; then
    echo "Error: File $filename not found."
    exit 1
fi

# Read each word from the file and use it as an argument for g++
while IFS= read -r word; do
    if [ -n "$word" ]; then
        g++ "$source_folder"/*.cpp -o "app_$word" -D"$word"
        if [ $? -eq 0 ]; then
            echo "Compilation successful for $word"
            
            # Execute ./app_$word for the specified number of repetitions
            for ((i=1; i<=$repetitions; i++)); do
                ./app_$word
            done
            rm -rf "app_$word"
        else
            echo "Error compiling for $word"
        fi
    fi
done < "$filename"
