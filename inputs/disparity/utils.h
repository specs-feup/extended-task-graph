/*===============================================================*/
/*                                                               */
/*                           utils.h                             */
/*                                                               */
/*                       Utility functions                       */
/*                                                               */
/*===============================================================*/

#include <string>

void print_usage(char* filename);

void parse_sdaccel_command_line_args(
    int argc,
    char** argv,
    std::string& kernelFile,
    std::string& path_to_data);

void parse_sdsoc_command_line_args(
    int argc,
    char** argv,
    std::string& path_to_data);
