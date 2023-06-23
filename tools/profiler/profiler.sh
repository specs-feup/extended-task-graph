#!/bin/sh

if [ -z "$1" ]; then
  echo "Argument 1 (program name) is missing. Exiting the script."
  exit 1
fi

APP=$1
DASHES="--------------------------------------------------------------------------------"

echo $DASHES
echo "Input application: $1"

echo $DASHES
echo "Checking prerequisites:"
if ! command -v python >/dev/null 2>&1; then
  echo "python is not installed. Please install Python to run this script."
  exit 1
fi
echo "python is installed"

if ! command -v pip >/dev/null 2>&1; then
  echo "pip (Python's package manager) is not installed. Please install pip to run this script."
  exit 1
fi
echo "pip is installed"

if ! command -v perf >/dev/null 2>&1; then
  echo "perf (Linux's profiler) is not installed. Please install perf to run this script."
  exit 1
fi
echo "perf is installed"
echo "All prerequisites met"

echo $DASHES
echo "Compiling..."
cd ../src_inter_tasks
g++ -g -fno-inline -O0 -o $APP *.cpp
mv $APP ../estim_cpu
cd ../estim_cpu
echo "Compilation successful"

echo $DASHES
echo "Running the application 10 times to get several measurements"
# execute app 10 times to get some exec times
i=1
while [ $i -le 10 ]
do
    ./$APP
    i=$((i + 1))
done

echo $DASHES
echo "Profiling the application using perf"
perf record -g ./$APP
perf report --stdio -g none --percentage absolute -i ./perf.data | c++filt > all_percentages.txt
grep -e "%" all_percentages.txt > percentage_per_fun.txt
rm perf.data
rm -f perf.data.old
rm all_percentages.txt
echo "Profiling successful"

echo $DASHES
echo "Ensuring py-cpuinfo is installed"
pip show py-cpuinfo || pip install py-cpuinfo
echo "py-cpuinfo is installed"

echo $DASHES
echo "Collating results into a JSON"
python_args="$APP timing_results.csv percentage_per_fun.txt"
python << EOF
import csv
import sys
import json
import cpuinfo


def get_average_time(times):
    accumul = 0
    count = 0

    with open(times, "r") as file:
        reader = csv.reader(file, delimiter=" ")
        for row in reader:
            stripped = row[0].rstrip("us")
            asInt = int(stripped)
            accumul += asInt
            count += 1

    average = int(accumul / count)
    return average, count


def get_function_list(percentages, appname):
    funs = []

    with open(percentages, "r") as file:
        for line in file:
            elements = line.split()
            prefix = elements[2]
            prog_name = elements[3]
            if prog_name.startswith(prefix) and prog_name == appname:
                percent = elements[1]
                percent_float = float(percent.rstrip("%"))
                sig = " ".join(elements[5:])
                fname, args = get_processed_signature(sig)

                funs.append([percent_float, fname, args])
    return funs


def get_processed_signature(sig):
    splitstr = sig.split("(")
    fname = splitstr[0]
    args = []

    if len(splitstr) > 1:
        args = splitstr[1].replace(")", "")
        args = args.split(", ")

    return fname, args


def main():
    #appname = sys.argv[1]
    #times = sys.argv[2]
    #percentages = sys.argv[3]

    args = "$python_args".split()
    appname = args[0]
    times = args[1]
    percentages = args[2]

    avg_time, nruns = get_average_time(times)
    fun_list = get_function_list(percentages, appname)
    cpu_info = cpuinfo.get_cpu_info()
    cpu_model = cpu_info["brand_raw"]

    data = {
        "appName": appname,
        "cpu": cpu_model,
        "averageTime": avg_time,
        "numberOfRuns": nruns,
        "percentages": fun_list,
    }
    json_data = json.dumps(data, indent=4)
    json_name = "cpu_estim_" + appname + ".json"
    with open(json_name, "w+") as file:
        file.write(json_data)
    print(f"JSON data saved to {json_name}")


if __name__ == "__main__":
    main()
EOF

echo $DASHES

rm timing_results.csv
rm percentage_per_fun.txt
rm $APP
