from json_to_csv import JSONToCSVConverter


class GlobalVarData(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="global_var_data"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
            "Suite",
            "Benchmark",
            "Global Data Name",
            "Size (bytes)",
            "Type",
            "isScalar",
            "isInitialized",
            "isWritten",
            "isRead",
        ]

    def convert_to_full(self, writer, suite, bench, data):
        global_data = data.get("globalData", {})
        cnt = 0

        for data_name, data_info in global_data.items():
            row_data = [
                suite,
                bench,
                data_name,
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
            ]
            writer.writerow(row_data)

    def get_min_header(self):
        return ["Benchmark", "#Globals", "Total Size (bytes)"]

    def convert_to_min(self, writer, json_obj):
        for app_name, data in self.json_obj.items():
            global_data = data.get("globalData", {})
            total_size = 0
            for data_name, data_info in global_data.items():
                total_size += data_info.get("sizeInBytes", 0)

            row_data = [
                self.get_suite(app_name) + "-" + self.get_benchmark(app_name),
                len(global_data),
                total_size,
            ]
            writer.writerow(row_data)
