from data_aggregator import DataAggregator


def main():
    folder_path = "../../test/outputs"
    valid_subfolders = [
        # "MachSuite-aes-D",
        "MachSuite-backprop-D",
        "MachSuite-fft-transpose-D",
        "MachSuite-kmp-D",
        "MachSuite-sort-merge-D",
        "MachSuite-sort-radix-D",
        "Rosetta-3d-rendering-N",
        "Rosetta-digit-recognition-N",
        "Rosetta-face-detection-N",
        "Rosetta-optical-flow-current",
        "Rosetta-spam-filter-N",
        # "edgedetect",
        # "stresstest",
    ]

    data_aggregator = DataAggregator(folder_path, valid_subfolders)
    data_aggregator.output_combined_json()
    print("Created combined JSON")

    csv_files = data_aggregator.convert_all_to_csv()
    csv_full = [row[0] for row in csv_files]
    csv_min = [row[1] for row in csv_files]
    print("Created intermediary CSV files")

    full_ranges_for_merging = {
        "general_stats": range(1, 3),
        "unique_task_data": range(1, 3),
        "no_task_calls_histogram": range(1, 3),
        "no_task_calls_hist_total": range(1, 1),
        "data_per_task": range(1, 5),
        "global_var_data": range(1, 3),
        "data_source_distance": range(1, 5),
        "data_paths": range(1, 3),
        "parallel_tasks": range(1, 3),
        "parallelism_metric": range(1, 3),
        "producer_consumer_relationship": range(1, 3),
    }
    data_aggregator.output_excel_from_csv_list(
        csv_full, ranges_for_merging=full_ranges_for_merging, excel_filename="data_full"
    )
    print("Created combined Excel with full data")

    min_ranges_for_merging = {}
    data_aggregator.output_excel_from_csv_list(
        csv_min, ranges_for_merging=min_ranges_for_merging, excel_filename="data_min"
    )
    print("Created combined Excel with min data")


if __name__ == "__main__":
    main()
