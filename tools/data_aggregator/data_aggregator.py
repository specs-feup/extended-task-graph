import os
import json

class DataAggregator:
    def __init__(self, folder_path, valid_subfolders=None):
        self.folder_path = folder_path
        self.valid_subfolders = valid_subfolders

    def index_jsons(self):
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

        return json_map

    def output_combined_json(self, output_file_path='combined.json'):
        json_map = self.index_jsons()

        with open(output_file_path, 'w') as output_file:
            json.dump(json_map, output_file, indent=2)

