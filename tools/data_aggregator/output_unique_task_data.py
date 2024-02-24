from json_to_csv import JSONToCSVConverter


class UniqueTaskData(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="unique_task_data"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        header = [
            "Suite",
            "Benchmark",
            "Task Name",
            "Task Type",
            "#Statements",
            "#forLoops",
            "#whileLoops",
            "#ifs",
            "#switches",
            "%loops with static number of iter.",
            "Iterations per Call Sites",
        ]
        return header

    def convert_to_full(self, writer, suite, bench, data):
        types = data.get("uniqueTaskTypes", {})
        instances = data.get("uniqueTaskInstances", {})

        for task_name, task_type in types.items():
            task_props = instances.get(task_name, "N/A")

            instance_list = task_props.get("instances", [])
            n_statements = task_props.get("#statements", "N/A")
            n_for_loops = task_props.get("#loops", "N/A")
            n_while_loops = task_props.get("#whiles", "N/A")
            n_ifs = task_props.get("#ifs", "N/A")
            n_switches = task_props.get("#switches", "N/A")
            n_static_loops = task_props.get("perLoopsStaticCounts", "N/A")
            n_static_loops = self.to_percentage_str(n_static_loops)

            row_data = [
                suite,
                bench,
                task_name,
                task_type,
                n_statements,
                n_for_loops,
                n_while_loops,
                n_ifs,
                n_switches,
                n_static_loops,
            ]
            row_data.extend(instance_list)

            writer.writerow(row_data)

    def get_min_header(self):
        return ["suite", "benchmark", "min_time"]

    def convert_to_min(self, writer, json_obj):
        pass
