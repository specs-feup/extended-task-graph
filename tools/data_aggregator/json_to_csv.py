import csv
import os
from abc import ABC, abstractmethod


class JSONToCSVConverter(ABC):
    def __init__(self, json_obj, name, out_folder):
        self.json_obj = json_obj
        self.name = name
        self.out_folder = out_folder

    def convert_to_csv(self):
        path_full = os.path.join(self.out_folder, self.name + "_full.csv")
        path_min = os.path.join(self.out_folder, self.name + "_min.csv")

        with open(path_full, "w", newline="") as file:
            writer = csv.writer(file)

            header = self.get_full_header()
            writer.writerow(header)

            for app_name, data in self.json_obj.items():
                suite = self.get_suite_benchmark(app_name)[0]
                bench = self.get_suite_benchmark(app_name)[1]
                self.convert_to_full(writer, suite, bench, data)

        with open(path_min, "w", newline="") as file:
            writer = csv.writer(file)

            header = self.get_min_header()
            writer.writerow(header)

            for app_name, data in self.json_obj.items():
                suite = self.get_suite_benchmark(app_name)[0]
                bench = self.get_suite_benchmark(app_name)[1]
                self.convert_to_min(writer, suite, bench, data)

        return path_full, path_min

    def get_suite_benchmark(self, app_name):
        split = app_name.split("-")
        if len(split) < 2:
            return "<No suite>", app_name
        else:
            return split[0], "-".join(split[1:-1])

    def to_percentage_str(self, input_str):
        try:
            number = float(input_str)
            if 0 <= number <= 1:
                return f"{number * 100:.2f}%"
            else:
                return input_str
        except ValueError:
            return input_str

    @abstractmethod
    def convert_to_full(self, writer, suite, bench, data):
        pass

    @abstractmethod
    def convert_to_min(self, writer, suite, bench, data):
        pass

    @abstractmethod
    def get_full_header(self):
        pass

    @abstractmethod
    def get_min_header(self):
        pass
