from json_to_csv import JSONToCSVConverter


class DataPaths(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="data_paths"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
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

    def convert_to_full(self, writer, suite, bench, data):
        paths = data.get("dataPaths", {})

        for data_name, data_info in paths.items():

            row_data = [
                suite,
                bench,
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
            writer.writerow(row_data)

    def get_min_header(self):
        return []

    def convert_to_min(self, writer, json_obj):
        pass
