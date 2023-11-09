import os
import json
import csv

class DataAggregator:
    def __init__(self, folder_path, valid_subfolders=None):
        self.folder_path = folder_path
        self.valid_subfolders = valid_subfolders
        self.cached_json_map = None

    def get_indexed_jsons(self):
        if self.cached_json_map is not None:
            return self.cached_json_map
        
        json_map = {}

        for subfolder in os.listdir(self.folder_path):
            subfolder_path = os.path.join(self.folder_path, subfolder, "taskgraph")

            if self.valid_subfolders is None or (os.path.isdir(subfolder_path) and subfolder in self.valid_subfolders):
                json_name = subfolder + '_task_graph_metrics.json'
                json_file_path = os.path.join(subfolder_path, json_name)

                if os.path.exists(json_file_path):
                    with open(json_file_path, 'r') as json_file:
                        data = json.load(json_file)

                        if 'appName' in data:
                            app_name = data['appName']
                            json_map[app_name] = data

        self.cached_json_map = json_map
        return json_map

    def output_combined_json(self, output_file_path='combined_output.json'):
        json_map = self.get_indexed_jsons()

        with open(output_file_path, 'w') as output_file:
            json.dump(json_map, output_file, indent=4)

    def output_combined_csv(self, csv_file_path='combined_output.csv'):
        json_map = self.get_indexed_jsons()

        with open(csv_file_path, 'w', newline='') as csv_file:
            csv_writer = csv.writer(csv_file)

            header = [
                "Suite",
                "Benchmark", 
                "regularTasks",
                "externalTasks",
                "inlinableCalls",
                "globalVariables",
            ]
            csv_writer.writerow(header)

            # Write rows
            for app_name, data in json_map.items():
                row_data = [
                    app_name.split('-')[0],
                    '-'.join(app_name.split('-')[1:-1]),

                    data.get('counts', {}).get('regularTasks', 'N/A'),
                    data.get('counts', {}).get('externalTasks', 'N/A'),
                    data.get('counts', {}).get('inlinableCalls', 'N/A'),
                    data.get('counts', {}).get('globalVars', 'N/A'),
                ]
                csv_writer.writerow(row_data)

