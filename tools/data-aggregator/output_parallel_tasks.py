from json_to_csv import JSONToCSVConverter


class ParallelTasks(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="parallel_tasks"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
            "Suite",
            "Benchmark",
            "Task ID 1",
            "Task ID 2",
            "Hier. Parent ID",
            "isParallel",
            "Task Name 1",
            "Task Name 2",
            "Hier. Parent Name",
        ]

    def convert_to_full(self, writer, suite, bench, data):
        parallel_tasks = data.get("parallelTasks", {})

        for pair_info in parallel_tasks:
            row_data = [
                suite,
                bench,
                pair_info.get("pair", {})[0].split(" : ")[0],
                pair_info.get("pair", {})[1].split(" : ")[0],
                pair_info.get("hierarchicalParent", {}).split(" : ")[0],
                pair_info.get("areParallel", "N/A"),
                pair_info.get("pair", {})[1].split(" : ")[1],
                pair_info.get("pair", {})[1].split(" : ")[1],
                pair_info.get("hierarchicalParent", {}).split(" : ")[1],
            ]
            writer.writerow(row_data)

    def get_min_header(self):
        return []

    def convert_to_min(self, writer, json_obj):
        pass
