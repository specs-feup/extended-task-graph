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
        return [
            "Benchmark",
            "#Subgraphs",
            "Avg. CP Length",
            "Avg. Parallelism Level",
        ]

    def convert_to_min(self, writer, json_obj):
        for app_name, data in self.json_obj.items():
            crit_paths = data.get("criticalPaths", {})

            total_subgraphs = 0
            total_cp_length = 0
            total_parallelism_level = 0

            for hier_task, hier_info in crit_paths.items():
                total_subgraphs += 1
                total_cp_length += hier_info.get("criticalPathLength", 0)
                total_parallelism_level += hier_info.get("parallelismMeasure", 0)

            row_data = [
                self.get_suite(app_name) + "-" + self.get_benchmark(app_name),
                total_subgraphs,
                total_cp_length / total_subgraphs,
                total_parallelism_level / total_subgraphs,
            ]
            writer.writerow(row_data)
