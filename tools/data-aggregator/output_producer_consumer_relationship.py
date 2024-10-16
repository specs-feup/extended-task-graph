from json_to_csv import JSONToCSVConverter


class ProducerConsumerRelationship(JSONToCSVConverter):
    def __init__(self, json_obj, out_folder, name="producer_consumer_relationship"):
        super().__init__(json_obj, out_folder, name)

    def get_full_header(self):
        return [
            "Suite",
            "Benchmark",
            "Task ID 1",
            "Task ID 2",
            "Hier. Parent ID",
            "Data",
            "Task Name 1",
            "Task Name 2",
            "Hier. Parent Name",
        ]

    def convert_to_full(self, writer, suite, bench, data):
        parallel_tasks = data.get("producerConsumer", {})

        for pair_info in parallel_tasks:
            row_data = [
                suite,
                bench,
                pair_info.get("pair", {})[0].split(" : ")[0],
                pair_info.get("pair", {})[1].split(" : ")[0],
                pair_info.get("hierarchicalParent", {}).split(" : ")[0],
                " | ".join(pair_info.get("commonData", "N/A")),
                pair_info.get("pair", {})[1].split(" : ")[1],
                pair_info.get("pair", {})[1].split(" : ")[1],
                pair_info.get("hierarchicalParent", {}).split(" : ")[1],
            ]
            writer.writerow(row_data)

    def get_min_header(self):
        return ["Benchmark", "#Pairs", "%Communication"]

    def convert_to_min(self, writer, json_obj):
        for app_name, data in json_obj.items():
            parallel_tasks = data.get("producerConsumer", {})
            edges = data.get("counts", {}).get("#edges", "N/A")

            total_pairs = 0
            for pair_info in parallel_tasks:
                total_pairs += 1 if len(pair_info.get("commonData", "N/A")) == 1 else 0

            row_data = [
                self.get_suite(app_name) + "-" + self.get_benchmark(app_name),
                total_pairs,
                total_pairs / int(edges),
            ]
            writer.writerow(row_data)
