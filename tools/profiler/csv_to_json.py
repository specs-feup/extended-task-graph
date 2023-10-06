import csv
import json
import sys

def calculate_average(data):
    averages = {}
    counts = {}

    for name, value in data:
        try:
            value = int(value)
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
            averages[name]['cpuTime'] //= counts[name]
        else:
            averages[name]['cpuTime'] = -1

    return averages

def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <output_json_file>")
        sys.exit(1)

    input_csv_file = 'input.csv'
    output_json_file = sys.argv[1]

    with open(input_csv_file, 'r') as csv_file:
        csv_reader = csv.reader(csv_file)
        next(csv_reader)  # Skip header

        data = [(row[0], row[1]) for row in csv_reader]

    averages = calculate_average(data)

    with open(output_json_file, 'w') as json_file:
        json.dump(averages, json_file, indent=2)

if __name__ == "__main__":
    main()
