from json_to_csv import JSONToCSVConverter


class DataPerTask(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="data_per_task"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
            "Suite",
            "Benchmark",
            "Task ID",
            "Task Name",
            "Data Name",
            "Origin",
            "Size (bytes)",
            "Type",
            "isScalar",
            "isInitialized",
            "isWritten",
            "isRead",
        ]

    def convert_to_full(self, writer, suite, bench, data):
        data_per_task = data.get("dataPerTask", {})

        for task, task_data in data_per_task.items():
            cnt = 0
            for data_name, data_info in task_data.items():
                row_data = [
                    suite,
                    bench,
                    task.split("-")[0],
                    task.split("-")[1],
                    data_name,
                    data_info.get("origin", "N/A"),
                    data_info.get("sizeInBytes", "N/A"),
                    data_info.get("cxxType", "N/A"),
                    data_info.get("isScalar", "N/A"),
                    data_info.get("stateChanges", {}).get("isInit", "N/A"),
                    data_info.get("stateChanges", {}).get("isWritten", "N/A"),
                    data_info.get("stateChanges", {}).get("isRead", "N/A"),
                ]
                writer.writerow(row_data)
                cnt += 1
            if cnt == 0:
                row_data = [
                    suite,
                    bench,
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                ]
                writer.writerow(row_data)

    def get_min_header(self):
        return []

    def convert_to_min(self, writer, json_obj):
        pass
