import os
import pandas as pd
import json
from datetime import datetime


class DataAggregator:
    def __init__(self, folder_path, acceptable_subfolders=None):
        self.folder_path = folder_path
        self.acceptable_subfolders = acceptable_subfolders
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        self.output_excel_path = os.path.join(folder_path, f"combined_{timestamp}.xlsx")

    def convert_to_excel(self):
        subfolders = [
            subfolder
            for subfolder in os.listdir(self.folder_path)
            if os.path.isdir(os.path.join(self.folder_path, subfolder))
        ]

        if not subfolders:
            print("No subfolders found in the main folder.")
            return

        combined_data = pd.DataFrame()

        for subfolder in subfolders:
            if (
                self.acceptable_subfolders
                and subfolder not in self.acceptable_subfolders
            ):
                continue

            subfolder_path = os.path.join(self.folder_path, subfolder)
            json_files = [
                file for file in os.listdir(subfolder_path) if file.endswith(".json")
            ]

            for json_file in json_files:
                file_path = os.path.join(subfolder_path, json_file)

                with open(file_path, "r") as f:
                    data = json.load(f)

                data["Key"] = subfolder
                combined_data = pd.concat(
                    [combined_data, pd.json_normalize(data)], ignore_index=True
                )

        combined_data.to_excel(self.output_excel_path, index=False)

        print(
            f"JSON files in subfolders of '{self.folder_path}' successfully combined into '{self.output_excel_path}'."
        )


# Example usage
folder_path = "/path/to/your/folder"
acceptable_subfolders = [
    "subfolder1",
    "subfolder2",
    "subfolder3",
]  # Specify acceptable subfolders or set to None
aggregator = DataAggregator(folder_path, acceptable_subfolders)
aggregator.convert_to_excel()
