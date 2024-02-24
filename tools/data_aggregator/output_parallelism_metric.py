from json_to_csv import JSONToCSVConverter


class ParallelismMetric(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="parallelism_metric"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
            "Suite",
            "Benchmark",
            "Hier. Parent",
            "#Tasks",
            "CP Length",
            "Parallelism Metric",
            "Critical Path",
        ]

    def convert_to_full(self, writer, suite, bench, data):
        crit_paths = data.get("criticalPaths", {})

        for hier_task, hier_info in crit_paths.items():
            row_data = [
                suite,
                bench,
                hier_info.get("hierachicalParent", "N/A"),
                hier_info.get("#Tasks", "N/A"),
                hier_info.get("criticalPathLength", "N/A"),
                hier_info.get("parallelismMeasure", "N/A"),
                " -> ".join(hier_info.get("criticalPath", {})),
            ]
            writer.writerow(row_data)

    def get_min_header(self):
        return []

    def convert_to_min(self, writer, json_obj):
        pass
