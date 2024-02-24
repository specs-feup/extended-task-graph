import os
import json
import csv
from excel_converter import ExcelConverter
from output_general_stats import GeneralStats
from output_unique_task_data import UniqueTaskData
from output_no_task_calls_histogram import NoTaskCallsHistogram
from output_no_task_calls_hist_total import NoTaskCallsHistTotal
from output_data_per_task import DataPerTask
from output_data_paths import DataPaths
from output_global_var_data import GlobalVarData
from output_data_source_distance import DataSourceDistance
from output_parallel_tasks import ParallelTasks
from output_parallelism_metric import ParallelismMetric
from output_producer_consumer_relationship import ProducerConsumerRelationship


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

        for folder in self.valid_subfolders:
            subfolder_path = os.path.join(self.folder_path, folder, "taskgraph")
            json_name = folder + "_task_graph_metrics.json"

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

    def convert_all_to_csv(self):
        data = self.get_indexed_jsons()
        out = self.output_folder

        csv_pairs = [
            GeneralStats(data, out).convert_to_csv(),
            UniqueTaskData(data, out).convert_to_csv(),
            NoTaskCallsHistogram(data, out).convert_to_csv(),
            NoTaskCallsHistTotal(data, out).convert_to_csv(),
            DataPerTask(data, out).convert_to_csv(),
            DataPaths(data, out).convert_to_csv(),
            GlobalVarData(data, out).convert_to_csv(),
            DataSourceDistance(data, out).convert_to_csv(),
            ParallelTasks(data, out).convert_to_csv(),
            ParallelismMetric(data, out).convert_to_csv(),
            ProducerConsumerRelationship(data, out).convert_to_csv(),
        ]
        return csv_pairs
