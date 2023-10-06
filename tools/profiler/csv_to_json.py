import csv
import json
import sys

def remove_us_suffix(value):
    # Remove "us" from the end of the value
    return value[:-2] if value.endswith("us") else value

def calculate_average(data):
    averages = {}
    counts = {}

    for name, value in data:
        try:
            value = int(remove_us_suffix(value))
      
        except ValueError:
            # Skip lines where the value is missing or not an integer
            continue

        if name not in averages:
            averages[name] = {'cpuTime': 0}
            counts[name] = 0

        averages[name]['cpuTime'] += value
        counts[name] += 1

    for name in averages:
        if counts[name] > 0:
            avg = averages[name]['cpuTime'] / counts[name]
            averages[name]['cpuTime'] = float(avg) / 1e6  # Convert to seconds
        else:
            averages[name]['cpuTime'] = -1.0

    return averages

def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_csv_file> <output_json_file>")
        sys.exit(1)

    input_csv_file = sys.argv[1]
    output_json_file = sys.argv[2]

    with open(input_csv_file, 'r') as csv_file:
        csv_reader = csv.reader(csv_file)
        next(csv_reader)  # Skip header

        data = [(row[0], row[1]) for row in csv_reader]

    averages = calculate_average(data)

    with open(output_json_file, 'w') as json_file:
        json.dump(averages, json_file, indent=2)

if __name__ == "__main__":
    main()
