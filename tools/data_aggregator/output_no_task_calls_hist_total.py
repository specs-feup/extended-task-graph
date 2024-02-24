from json_to_csv import JSONToCSVConverter


class NoTaskCallsHistTotal(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="no_task_calls_hist_total"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return ["No Task Function", "Total Call Sites"]

    def convert_to_full(self, writer, suite, bench, data):
        no_task_calls = data.get("noTaskCallsHistogram", {})

        for func_name, call_count in no_task_calls.items():
            writer.writerow([func_name, call_count])

    def get_min_header(self):
        return ["No Task Function", "Total Call Sites"]

    def convert_to_min(self, writer, suite, bench, data):
        no_task_calls = data.get("noTaskCallsHistogram", {})

        for func_name, call_count in no_task_calls.items():
            writer.writerow([func_name, call_count])
