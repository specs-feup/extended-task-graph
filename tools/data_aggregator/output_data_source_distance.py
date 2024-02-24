from json_to_csv import JSONToCSVConverter


class DataSourceDistance(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="data_source_distance"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
            "Suite",
            "Benchmark",
            "Task ID",
            "Task Name",
            "Data Name",
            "Distance To Origin",
            "Path To Origin",
            "Name Evolution",
        ]

    def convert_to_full(self, writer, suite, bench, data):
        dists = data.get("dataSourceDistance", {})

        for task, dist_data in dists.items():
            for data_name, data_info in dist_data.items():
                row_data = [
                    suite,
                    bench,
                    task.split("-")[0],
                    task.split("-")[1],
                    data_name,
                    data_info.get("distanceToOrigin", "N/A"),
                    " -> ".join(data_info.get("pathToOrigin", "N/A")),
                    " -> ".join(data_info.get("dataEvolution", "N/A")),
                ]
                writer.writerow(row_data)

    def get_min_header(self):
        return []

    def convert_to_min(self, writer, suite, bench, data):
        pass
