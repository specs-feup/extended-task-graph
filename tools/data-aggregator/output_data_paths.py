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
        return [
            "Benchmark",
            "#Data Items",
            "Avg. Size (bytes)",
            "Avg. R/W Path Length",
            "Avg. #Read Paths",
            "Avg. #Aliases",
        ]

    def convert_to_min(self, writer, json_obj):
        for app_name, data in self.json_obj.items():
            paths = data.get("dataPaths", {})

            total_size = 0
            total_rw_path_length = 0
            total_read_paths = 0
            total_aliases = 0

            for data_name, data_info in paths.items():
                total_size += data_info.get("sizeInBytes", 0)
                total_rw_path_length += data_info.get("mainPathLength", 0)
                total_read_paths += data_info.get("#spurs", 0)
                total_aliases += data_info.get("#aliases", 0)

            row_data = [
                self.get_suite(app_name) + "-" + self.get_benchmark(app_name),
                len(paths),
                total_size / len(paths) if len(paths) > 0 else "N/A",
                total_rw_path_length / len(paths) if len(paths) > 0 else "N/A",
                total_read_paths / len(paths) if len(paths) > 0 else "N/A",
                total_aliases / len(paths) if len(paths) > 0 else "N/A",
            ]
            writer.writerow(row_data)
