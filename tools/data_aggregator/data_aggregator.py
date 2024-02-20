import os
import json
import csv
from excel_converter import ExcelConverter


class DataAggregator:
    def __init__(self, folder_path, valid_subfolders=None, output_folder="outputs"):
        self.folder_path = folder_path
        self.valid_subfolders = valid_subfolders
        self.output_folder = output_folder
        self.cached_json_map = None

    def get_indexed_jsons(self):
        if self.cached_json_map is not None:
            return self.cached_json_map

        json_map = {}

        for subfolder in os.listdir(self.folder_path):
            subfolder_path = os.path.join(self.folder_path, subfolder, "taskgraph")

            if self.valid_subfolders is None or (
                os.path.isdir(subfolder_path) and subfolder in self.valid_subfolders
            ):
                json_name = subfolder + "_task_graph_metrics.json"
                json_file_path = os.path.join(subfolder_path, json_name)

                if os.path.exists(json_file_path):
                    with open(json_file_path, "r") as json_file:
                        data = json.load(json_file)

                        if "appName" in data:
                            app_name = data["appName"]
                            json_map[app_name] = data

        self.cached_json_map = json_map
        return json_map

    def get_full_path(self, filename):
        return os.path.join(self.output_folder, filename)

    def get_suite_benchmark(self, app_name):
        split = app_name.split("-")
        if len(split) < 2:
            return "<No suite>", app_name
        else:
            return split[0], "-".join(split[1:-1])

    def to_percentage_str(self, input_str):
        try:
            number = float(input_str)
            if 0 <= number <= 1:
                return f"{number * 100:.2f}%"
            else:
                return input_str
        except ValueError:
            return input_str

    def output_combined_json(self, output_file_path="combined_output.json"):
        json_map = self.get_indexed_jsons()

        output_file_path = self.get_full_path(output_file_path)
        with open(output_file_path, "w") as output_file:
            json.dump(json_map, output_file, indent=4)

    def output_excel_from_csv_list(
        self, csv_files, excel_filename="combined_output.xlsx", ranges_for_merging={}
    ):
        excel_filename = self.get_full_path(excel_filename)
        converter = ExcelConverter()
        converter.csv_files_to_excel(
            csv_files,
            excel_filename,
            delete_csv=True,
            ranges_for_merging=ranges_for_merging,
        )

    def output_general_stats(self, csv_file_path="general_stats.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "#Tasks",
                "#Edges",
                "regularTasks",
                "externalTasks",
                "inlinableCalls",
                "globalVariables",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                row_data = [
                    self.get_suite_benchmark(app_name)[0],
                    self.get_suite_benchmark(app_name)[1],
                    data.get("counts", {}).get("#tasks", "N/A"),
                    data.get("counts", {}).get("#edges", "N/A"),
                    data.get("counts", {}).get("regularTasks", "N/A"),
                    data.get("counts", {}).get("externalTasks", "N/A"),
                    data.get("counts", {}).get("inlinableCalls", "N/A"),
                    data.get("counts", {}).get("globalVars", "N/A"),
                ]
                csv_writer.writerow(row_data)
        return csv_file_path

    def output_unique_task_data(self, csv_file_path="unique_task_data.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Task Name",
                "Task Type",
                "#Statements",
                "#forLoops",
                "#whileLoops",
                "#ifs",
                "#switches",
                "%loops with static number of iter.",
                "Iterations per Call Sites",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                types = data.get("uniqueTaskTypes", {})
                instances = data.get("uniqueTaskInstances", {})

                for task_name, task_type in types.items():
                    task_props = instances.get(task_name, "N/A")

                    instance_list = task_props.get("instances", [])
                    n_statements = task_props.get("#statements", "N/A")
                    n_for_loops = task_props.get("#loops", "N/A")
                    n_while_loops = task_props.get("#whiles", "N/A")
                    n_ifs = task_props.get("#ifs", "N/A")
                    n_switches = task_props.get("#switches", "N/A")
                    n_static_loops = task_props.get("perLoopsStaticCounts", "N/A")
                    n_static_loops = self.to_percentage_str(n_static_loops)

                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        task_name,
                        task_type,
                        n_statements,
                        n_for_loops,
                        n_while_loops,
                        n_ifs,
                        n_switches,
                        n_static_loops,
                    ]
                    row_data.extend(instance_list)

                    csv_writer.writerow(row_data)

        return csv_file_path

    def output_no_task_calls_histogram(
        self, csv_file_path="no_task_calls_histogram.csv"
    ):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = ["Suite", "Benchmark", "No Task Function", "Instances/Call Sites"]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                no_task_calls = data.get("noTaskCallsHistogram", {})
                cnt = 0

                for func_name, call_count in no_task_calls.items():
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        func_name,
                        call_count,
                    ]
                    csv_writer.writerow(row_data)
                    cnt += 1

                if cnt == 0:
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        "N/A",
                        "N/A",
                    ]
                    csv_writer.writerow(row_data)

        return csv_file_path

    def output_no_task_calls_hist_total(
        self, csv_file_path="no_task_calls_hist_total.csv"
    ):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)
        total_histogram = {}

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = ["No Task Function", "Total Call Sites"]
            csv_writer.writerow(header)

            for app_name, data in json_map.items():
                no_task_calls = data.get("noTaskCallsHistogram", {})

                for func_name, call_count in no_task_calls.items():
                    if func_name in total_histogram.keys():
                        total_histogram[func_name] += call_count
                    else:
                        total_histogram[func_name] = call_count

            for func, count in total_histogram.items():
                csv_writer.writerow([func, count])

        return csv_file_path

    def output_data_per_task(self, csv_file_path="data_per_task.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Task ID",
                "Task Name",
                "Data Name",
                "Origin",
                "Size (bytes)",
                "Type",
                "isScalar",
                "isInitialized",
                "isWritten",
                "isRead",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                data_per_task = data.get("dataPerTask", {})

                for task, task_data in data_per_task.items():
                    cnt = 0
                    for data_name, data_info in task_data.items():
                        row_data = [
                            self.get_suite_benchmark(app_name)[0],
                            self.get_suite_benchmark(app_name)[1],
                            task.split("-")[0],
                            task.split("-")[1],
                            data_name,
                            data_info.get("origin", "N/A"),
                            data_info.get("sizeInBytes", "N/A"),
                            data_info.get("cxxType", "N/A"),
                            data_info.get("isScalar", "N/A"),
                            data_info.get("stateChanges", {}).get("isInit", "N/A"),
                            data_info.get("stateChanges", {}).get("isWritten", "N/A"),
                            data_info.get("stateChanges", {}).get("isRead", "N/A"),
                        ]
                        csv_writer.writerow(row_data)
                        cnt += 1
                    if cnt == 0:
                        row_data = [
                            self.get_suite_benchmark(app_name)[0],
                            self.get_suite_benchmark(app_name)[1],
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                        ]
                        csv_writer.writerow(row_data)

        return csv_file_path

    def output_global_var_data(self, csv_file_path="global_var_data.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Global Data Name",
                "Size (bytes)",
                "Type",
                "isScalar",
                "isInitialized",
                "isWritten",
                "isRead",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                global_data = data.get("globalData", {})
                cnt = 0

                for data_name, data_info in global_data.items():
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        data_name,
                        data_info.get("sizeInBytes", "N/A"),
                        data_info.get("cxxType", "N/A"),
                        data_info.get("isScalar", "N/A"),
                        data_info.get("stateChanges", {}).get("isInit", "N/A"),
                        data_info.get("stateChanges", {}).get("isWritten", "N/A"),
                        data_info.get("stateChanges", {}).get("isRead", "N/A"),
                    ]
                    csv_writer.writerow(row_data)
                    cnt += 1
                if cnt == 0:
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                    ]
                    csv_writer.writerow(row_data)

        return csv_file_path

    def output_data_source_distance(self, csv_file_path="data_source_distance.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Task ID",
                "Task Name",
                "Data Name",
                "Distance To Origin",
                "Path To Origin",
                "Name Evolution",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                dists = data.get("dataSourceDistance", {})

                for task, dist_data in dists.items():
                    for data_name, data_info in dist_data.items():
                        row_data = [
                            self.get_suite_benchmark(app_name)[0],
                            self.get_suite_benchmark(app_name)[1],
                            task.split("-")[0],
                            task.split("-")[1],
                            data_name,
                            data_info.get("distanceToOrigin", "N/A"),
                            " -> ".join(data_info.get("pathToOrigin", "N/A")),
                            " -> ".join(data_info.get("dataEvolution", "N/A")),
                        ]
                        csv_writer.writerow(row_data)

        return csv_file_path

    def output_data_paths(self, csv_file_path="data_paths.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Data Item",
                "Data Type",
                "Size (bytes)",
                "Main Path Length",
                "#Spurs",
                "#Aliases",
                "Main Path",
                "Spurs",
                "Aliases",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                paths = data.get("dataPaths", {})

                for data_name, data_info in paths.items():
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        data_name,
                        data_info.get("datatype", "N/A"),
                        data_info.get("sizeInBytes", "N/A"),
                        data_info.get("mainPathLength", "N/A"),
                        data_info.get("#spurs", "N/A"),
                        data_info.get("#aliases", "N/A"),
                        " -> ".join(data_info.get("mainPath", "N/A")),
                        ", ".join(data_info.get("spurs", "N/A")),
                        ", ".join(data_info.get("aliases", "N/A")),
                    ]
                    csv_writer.writerow(row_data)

        return csv_file_path

    def output_parallel_tasks(self, csv_file_path="parallel_tasks.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Task ID 1",
                "Task ID 2",
                "Hier. Parent ID",
                "isParallel",
                "Task Name 1",
                "Task Name 2",
                "Hier. Parent Name",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                parallel_tasks = data.get("parallelTasks", {})

                for pair_info in parallel_tasks:
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        pair_info.get("pair", {})[0].split(" : ")[0],
                        pair_info.get("pair", {})[1].split(" : ")[0],
                        pair_info.get("hierarchicalParent", {}).split(" : ")[0],
                        pair_info.get("areParallel", "N/A"),
                        pair_info.get("pair", {})[1].split(" : ")[1],
                        pair_info.get("pair", {})[1].split(" : ")[1],
                        pair_info.get("hierarchicalParent", {}).split(" : ")[1],
                    ]
                    csv_writer.writerow(row_data)

        return csv_file_path

    # output_parallelism_metric
    def output_parallelism_metric(self, csv_file_path="parallelism_level.csv"):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Hier. Parent",
                "#Tasks",
                "CP Length",
                "Parallelism Metric",
                "Critical Path",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                crit_paths = data.get("criticalPaths", {})

                for hier_task, hier_info in crit_paths.items():
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        hier_info.get("hierachicalParent", "N/A"),
                        hier_info.get("#Tasks", "N/A"),
                        hier_info.get("criticalPathLength", "N/A"),
                        hier_info.get("parallelismMeasure", "N/A"),
                        " -> ".join(hier_info.get("criticalPath", {})),
                    ]
                    csv_writer.writerow(row_data)

        return csv_file_path

    def output_producer_consumer_relationship(
        self, csv_file_path="producer_consumer_relationship.csv"
    ):
        json_map = self.get_indexed_jsons()
        csv_file_path = self.get_full_path(csv_file_path)

        with open(csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark",
                "Task ID 1",
                "Task ID 2",
                "Hier. Parent ID",
                "Data",
                "Task Name 1",
                "Task Name 2",
                "Hier. Parent Name",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                parallel_tasks = data.get("producerConsumer", {})

                for pair_info in parallel_tasks:
                    row_data = [
                        self.get_suite_benchmark(app_name)[0],
                        self.get_suite_benchmark(app_name)[1],
                        pair_info.get("pair", {})[0].split(" : ")[0],
                        pair_info.get("pair", {})[1].split(" : ")[0],
                        pair_info.get("hierarchicalParent", {}).split(" : ")[0],
                        " | ".join(pair_info.get("commonData", "N/A")),
                        pair_info.get("pair", {})[1].split(" : ")[1],
                        pair_info.get("pair", {})[1].split(" : ")[1],
                        pair_info.get("hierarchicalParent", {}).split(" : ")[1],
                    ]
                    csv_writer.writerow(row_data)

        return csv_file_path
