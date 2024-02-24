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
        return [
            "Benchmark",
            "Avg #Statements",
            "#forLoops",
            "#whileLoops",
            "#ifs",
            "#switches",
            "%static loops",
        ]

    def convert_to_min(self, writer, json_obj):
        for app_name, data in self.json_obj.items():
            types = data.get("uniqueTaskTypes", {})
            instances = data.get("uniqueTaskInstances", {})

            n_statements = 0
            n_for_loops = 0
            n_while_loops = 0
            n_ifs = 0
            n_switches = 0
            n_static_loops = 0
            n_tasks = 0

            for task_name, task_type in types.items():
                task_props = instances.get(task_name, "N/A")

                n_statements += int(task_props.get("#statements", 0))
                n_for_loops += int(task_props.get("#loops", 0))
                n_while_loops += int(task_props.get("#whiles", 0))
                n_ifs += int(task_props.get("#ifs", 0))
                n_switches += int(task_props.get("#switches", 0))

                per = task_props.get("perLoopsStaticCounts", 0)
                if per != "N/A":
                    n_static_loops += float(per)

                n_tasks += 1

            n_statements = n_statements / n_tasks
            n_static_loops = n_static_loops / n_tasks

            row_data = [
                self.get_suite(app_name) + "-" + self.get_benchmark(app_name),
                n_statements,
                n_for_loops,
                n_while_loops,
                n_ifs,
                n_switches,
                n_static_loops,
            ]
            writer.writerow(row_data)
