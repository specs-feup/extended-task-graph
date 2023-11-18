from data_aggregator import DataAggregator

def main():
    folder_path = '../../test/outputs'
    valid_subfolders = [
        #"MachSuite-aes-D",
        "MachSuite-backprop-D",
        #"MachSuite-fft-transpose-D",
        #"MachSuite-kmp-D",
        #"MachSuite-sort-merge-D",
        #"MachSuite-sort-radix-D",
        #"Rosetta-3d-rendering-N",
        #"Rosetta-digit-recognition-N",
        #"Rosetta-face-detection-N",
        #"Rosetta-optical-flow-current",
        #"Rosetta-spam-filter-N",
        #"edgedetect",
        #"stresstest",
    ]

    data_aggregator = DataAggregator(folder_path, valid_subfolders)
    data_aggregator.output_combined_json(),
    csv_files = [
        
        data_aggregator.output_general_stats(),
        data_aggregator.output_unique_task_data(),
        data_aggregator.output_no_task_calls_histogram(),
        data_aggregator.output_data_per_task(),
        data_aggregator.output_global_var_data(),
        data_aggregator.output_data_source_distance(),
        data_aggregator.output_parallel_tasks(),
        data_aggregator.output_producer_consumer_relationship(),
    ]
    ranges_for_merging = {
        "general_stats": range(1, 3),
        "unique_task_data": range(1, 3),
        "no_task_calls_histogram": range(1, 3),
        "data_per_task": range(1, 5),
        "global_var_data": range(1, 3),
        "data_source_distance": range(1, 5),
        "parallel_tasks": range(1, 3),
        "producer_consumer_relationship": range(1, 3),
    }
    data_aggregator.output_excel_from_csv_list(csv_files, ranges_for_merging=ranges_for_merging)

if __name__ == '__main__':
    main()
