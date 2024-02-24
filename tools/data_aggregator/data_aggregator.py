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

    def output_combined_json(self, output_file_path="combined_output.json"):
        json_map = self.get_indexed_jsons()

        output_file_path = self.get_full_path(output_file_path)
        with open(output_file_path, "w") as output_file:
            json.dump(json_map, output_file, indent=4)

    def output_excel_from_csv_list(
        self, csv_files, excel_filename="combined_output", ranges_for_merging={}
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

        converters = [
            GeneralStats(data, out),
            UniqueTaskData(data, out),
            NoTaskCallsHistogram(data, out),
            NoTaskCallsHistTotal(data, out),
            DataPerTask(data, out),
            DataPaths(data, out),
            GlobalVarData(data, out),
            DataSourceDistance(data, out),
            ParallelTasks(data, out),
            ParallelismMetric(data, out),
            ProducerConsumerRelationship(data, out),
        ]

        full_csv_files = []
        min_csv_files = []
        for converter in converters:
            full_csv, min_csv = converter.convert_to_csv()
            full_csv_files.append(full_csv)
            min_csv_files.append(min_csv)

        return full_csv_files, min_csv_files
