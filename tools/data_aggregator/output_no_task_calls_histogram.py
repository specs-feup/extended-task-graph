from json_to_csv import JSONToCSVConverter


class NoTaskCallsHistogram(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="no_task_calls_histogram"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return ["Suite", "Benchmark", "No Task Function", "Instances/Call Sites"]

    def convert_to_full(self, writer, suite, bench, data):
        no_task_calls = data.get("noTaskCallsHistogram", {})
        cnt = 0

        for func_name, call_count in no_task_calls.items():
            row_data = [
                suite,
                bench,
                func_name,
                call_count,
            ]
            writer.writerow(row_data)
            cnt += 1

        if cnt == 0:
            row_data = [
                suite,
                bench,
                "N/A",
                "N/A",
            ]
            writer.writerow(row_data)

    def get_min_header(self):
        return []

    def convert_to_min(self, writer, json_obj):
        pass
