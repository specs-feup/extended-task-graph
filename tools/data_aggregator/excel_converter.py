import os
import json
import csv
import openpyxl

class ExcelConverter:

    def csv_files_to_excel(self, csv_files, excel_filename='combined_output.xlsx', delete_csv=False, ranges_for_merging = {}):
        workbook = openpyxl.Workbook()

        for csv_file in csv_files:
            sheet_name = csv_file.split('.')[0].split('/')[-1].split('\\')[-1]
            sheet = workbook.create_sheet(title=sheet_name)

            with open(csv_file, 'r') as file:
                csv_reader = csv.reader(file)
                for row_index, row in enumerate(csv_reader, start=1):
                    for col_index, value in enumerate(row, start=1):
                        sheet.cell(row=row_index, column=col_index, value=value)
            if delete_csv:
                os.remove(csv_file)
            
            merge_range = ranges_for_merging.get(sheet_name, range(1, 3))
            self.merge_and_center(sheet, merge_range)
            self.center_and_auto_size(sheet)


        workbook.remove(workbook['Sheet'])
        workbook.save(excel_filename)

    def merge_and_center(self, sheet, column_range=range(1, 3)):
        max_row = sheet.max_row

        for col in column_range:  # Only consider the first two columns
            current_value = sheet.cell(row=1, column=col).value
            start_row = 1

            for row in range(2, max_row + 1):
                cell_value = sheet.cell(row=row, column=col).value

                if cell_value != current_value:
                    if start_row < row - 1:
                        # Merge cells if there is more than one consecutive cell with the same value
                        sheet.merge_cells(start_row=start_row, end_row=row - 1, start_column=col, end_column=col)

                        # Center text both horizontally and vertically within the merged cells
                        for merge_row in range(start_row, row):
                            sheet.cell(row=merge_row, column=col).alignment = openpyxl.styles.Alignment(
                                horizontal='center',
                                vertical='center',
                                wrap_text=True  # Wrap text for merged cells
                            )

                    current_value = cell_value
                    start_row = row

            # Merge the last group of cells in the column
            if start_row < max_row:
                sheet.merge_cells(start_row=start_row, end_row=max_row, start_column=col, end_column=col)

                # Center text both horizontally and vertically within the merged cells
                for merge_row in range(start_row, max_row + 1):
                    sheet.cell(row=merge_row, column=col).alignment = openpyxl.styles.Alignment(
                        horizontal='center',
                        vertical='center',
                        wrap_text=True  # Wrap text for merged cells
                    )


    def center_and_auto_size(self, sheet):
        # Center text and auto-size columns and rows to fit the content
        for row in sheet.iter_rows(min_row=1, max_row=sheet.max_row):
            for cell in row:
                try:
                    cell.alignment = openpyxl.styles.Alignment(
                        wrap_text=True,
                        horizontal='center',
                        vertical='center',
                    )
                except:
                    pass

        for column in sheet.columns:
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = (max_length + 2)
            sheet.column_dimensions[column[0].column_letter].width = adjusted_width