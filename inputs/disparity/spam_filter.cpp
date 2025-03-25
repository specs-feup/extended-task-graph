/*===============================================================*/
/*                                                               */
/*                        spam_filter.cpp                        */
/*                                                               */
/*      Main host function for the Spam Filter application.      */
/*                                                               */
/*===============================================================*/

// standard C/C++ headers
#include <cstdio>
#include <cstdlib>
#include <getopt.h>
#include <string>
#include <time.h>
#include <sys/time.h>

#include "sgd_sw.h"

// other headers
#include "utils.h"
#include "typedefs.h"
#include "check_result.h"

int main(int argc, char *argv[])
{
  setbuf(stdout, NULL);

  printf("Spam Filter Application\n");

  // parse command line arguments
  std::string path_to_data("");
// sdaccel version and sdsoc/sw version have different command line options
#ifdef OCL
  std::string kernelFile("");
  parse_sdaccel_command_line_args(argc, argv, kernelFile, path_to_data);
#else
  parse_sdsoc_command_line_args(argc, argv, path_to_data);
#endif

  // allocate space
  // for software verification
  DataType *data_points = new DataType[DATA_SET_SIZE];
  LabelType *labels = new LabelType[NUM_SAMPLES];
  FeatureType *param_vector = new FeatureType[NUM_FEATURES];

  // read in dataset
  std::string str_points_filepath = path_to_data + "./shuffledfeats.dat";
  std::string str_labels_filepath = path_to_data + "./shuffledlabels.dat";

  FILE *data_file;
  FILE *label_file;

  data_file = fopen(str_points_filepath.c_str(), "r");
  if (!data_file)
  {
    printf("Failed to open data file %s!\n", str_points_filepath.c_str());
    return EXIT_FAILURE;
  }
  for (int i = 0; i < DATA_SET_SIZE; i++)
  {
    float tmp;
    fscanf(data_file, "%f", &tmp);
    data_points[i] = tmp;
  }
  fclose(data_file);

  label_file = fopen(str_labels_filepath.c_str(), "r");
  if (!label_file)
  {
    printf("Failed to open label file %s!\n", str_labels_filepath.c_str());
    return EXIT_FAILURE;
  }
  for (int i = 0; i < NUM_SAMPLES; i++)
  {
    int tmp;
    fscanf(label_file, "%d", &tmp);
    labels[i] = tmp;
  }
  fclose(label_file);

  // reset parameter vector
  for (size_t i = 0; i < NUM_FEATURES; i++)
    param_vector[i] = 0;

  // timers
  struct timeval start, end;

  gettimeofday(&start, NULL);
  SgdLR_sw(data_points, labels, param_vector);
  gettimeofday(&end, NULL);

  // check results
  printf("Checking results:\n");
  check_results(param_vector, data_points, labels);

  // print time
  long long elapsed = (end.tv_sec - start.tv_sec) * 1000000LL + end.tv_usec - start.tv_usec;
  printf("elapsed time: %lld us\n", elapsed);

// cleanup
  delete[] data_points;
  delete[] labels;
  delete[] param_vector;

  return EXIT_SUCCESS;
}
