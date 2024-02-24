from json_to_csv import JSONToCSVConverter


class GeneralStats(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="general_stats"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
            "Suite",
            "Benchmark",
            "#Tasks",
            "#Edges",
            "regularTasks",
            "externalTasks",
            "inlinableCalls",
            "globalVariables",
        ]

    def convert_to_full(self, writer, suite, bench, data):
        row_data = [
            suite,
            bench,
            data.get("counts", {}).get("#tasks", "N/A"),
            data.get("counts", {}).get("#edges", "N/A"),
            data.get("counts", {}).get("regularTasks", "N/A"),
            data.get("counts", {}).get("externalTasks", "N/A"),
            data.get("counts", {}).get("inlinableCalls", "N/A"),
            data.get("counts", {}).get("globalVars", "N/A"),
        ]
        writer.writerow(row_data)

    def get_min_header(self):
        return []

    def convert_to_min(self, writer, json_obj):
        pass
