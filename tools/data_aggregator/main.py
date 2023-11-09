from data_aggregator import DataAggregator

def main():
    folder_path = '../../test/outputs'
    valid_subfolders = [
        #"MachSuite-aes-D",
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
        "edgedetect",
    ]

    data_aggregator = DataAggregator(folder_path, valid_subfolders)

    result = data_aggregator.index_jsons()
    data_aggregator.output_combined_json('output_combined.json')

if __name__ == '__main__':
    main()
