#include <cstdlib>
#include <cstdio>
#include <cmath>
#include <chrono>
#include <iostream>
#include <fstream>
using namespace std;
using namespace std::chrono;
void rgbToGrayscale(int input_image[786432], int output_image[262144])
{
    for (int i = 0; i < 512; i++)
    {
        int jj;
        jj = 0;
        for (int j = 0; j < 512; j++)
        {
            int r;
            r = input_image[i * 512 * 3 + jj];
            int g;
            g = input_image[i * 512 * 3 + jj + 1];
            int b;
            b = input_image[i * 512 * 3 + jj + 2];
            jj = jj + 3;
            float gray;
            gray = 0.299 * r + 0.587 * g + 0.114 * b;
            output_image[i * 512 + j] = (int)floor(gray);
        }
    }
}

void convolve2d_rep2(int input_image[262144], int filter[9], int output_image[262144])
{
    int i;
    int j;
    int c;
    int r;
    int normal_factor;
    int sum;
    int dead_rows;
    int dead_cols;
    dead_rows = 1;
    dead_cols = 1;
    normal_factor = 0;
    for (r = 0; r < 3; r++)
    {
        for (c = 0; c < 3; c++)
        {
            int decomp_0;
            decomp_0 = abs(filter[r * 3 + c]);
            int decomp_1;
            decomp_1 = normal_factor + decomp_0;
            normal_factor = decomp_1;
        }
    }
    bool decomp_0;
    decomp_0 = normal_factor == 0;
    if (decomp_0)
    {
        normal_factor = 1;
    }
    for (r = 0; r < 510; r++)
    {
        for (c = 0; c < 510; c++)
        {
            sum = 0;
            for (i = 0; i < 3; i++)
            {
                for (j = 0; j < 3; j++)
                {
                    sum = sum + input_image[(r + i) * 512 + (c + j)] * filter[i * 3 + j];
                }
            }
            output_image[(r + dead_rows) * 512 + (c + dead_cols)] = (sum / normal_factor);
        }
    }
}

void convolve2d_rep1(int input_image[262144], int filter[9], int output_image[262144])
{
    int i;
    int j;
    int c;
    int r;
    int normal_factor;
    int sum;
    int dead_rows;
    int dead_cols;
    dead_rows = 1;
    dead_cols = 1;
    normal_factor = 0;
    for (r = 0; r < 3; r++)
    {
        for (c = 0; c < 3; c++)
        {
            int decomp_0;
            decomp_0 = abs(filter[r * 3 + c]);
            int decomp_1;
            decomp_1 = normal_factor + decomp_0;
            normal_factor = decomp_1;
        }
    }
    bool decomp_0;
    decomp_0 = normal_factor == 0;
    if (decomp_0)
    {
        normal_factor = 1;
    }
    for (r = 0; r < 510; r++)
    {
        for (c = 0; c < 510; c++)
        {
            sum = 0;
            for (i = 0; i < 3; i++)
            {
                for (j = 0; j < 3; j++)
                {
                    sum = sum + input_image[(r + i) * 512 + (c + j)] * filter[i * 3 + j];
                }
            }
            output_image[(r + dead_rows) * 512 + (c + dead_cols)] = (sum / normal_factor);
        }
    }
}

void convolve2d_rep0(int input_image[262144], int filter[9], int output_image[262144])
{
    int i;
    int j;
    int c;
    int r;
    int normal_factor;
    int sum;
    int dead_rows;
    int dead_cols;
    dead_rows = 1;
    dead_cols = 1;
    normal_factor = 0;
    for (r = 0; r < 3; r++)
    {
        for (c = 0; c < 3; c++)
        {
            int decomp_0;
            decomp_0 = abs(filter[r * 3 + c]);
            int decomp_1;
            decomp_1 = normal_factor + decomp_0;
            normal_factor = decomp_1;
        }
    }
    bool decomp_0;
    decomp_0 = normal_factor == 0;
    if (decomp_0)
    {
        normal_factor = 1;
    }
    for (r = 0; r < 510; r++)
    {
        for (c = 0; c < 510; c++)
        {
            sum = 0;
            for (i = 0; i < 3; i++)
            {
                for (j = 0; j < 3; j++)
                {
                    sum = sum + input_image[(r + i) * 512 + (c + j)] * filter[i * 3 + j];
                }
            }
            output_image[(r + dead_rows) * 512 + (c + dead_cols)] = (sum / normal_factor);
        }
    }
}

void combthreshold(int image_gray[262144], int temp_buf[262144], int output[262144])
{
    int i;
    int j;
    int temp1;
    int temp2;
    int temp3;
    for (i = 0; i < 512; i++)
    {
        for (j = 0; j < 512; ++j)
        {
            temp1 = abs(image_gray[i * 512 + j]);
            temp2 = abs(temp_buf[i * 512 + j]);
            temp3 = (temp1 > temp2) ? temp1 : temp2;
            output[i * 512 + j] = (temp3 > 50) ? 255 : 0;
        }
    }
}

void outlined_fun_0(int filter[9])
{
    filter[0] = 1;
    filter[1] = 2;
    filter[2] = 1;
    filter[3] = 2;
    filter[4] = 4;
    filter[5] = 2;
    filter[6] = 1;
    filter[7] = 2;
    filter[8] = 1;
}

void outlined_fun_1(int filter[9])
{
    filter[0] = 1;
    filter[1] = 0;
    filter[2] = -1;
    filter[3] = 2;
    filter[4] = 0;
    filter[5] = -2;
    filter[6] = 1;
    filter[7] = 0;
    filter[8] = -1;
}

void outlined_fun_2(int filter[9])
{
    filter[0] = 1;
    filter[1] = 2;
    filter[2] = 1;
    filter[3] = 0;
    filter[4] = 0;
    filter[5] = 0;
    filter[6] = -1;
    filter[7] = -2;
    filter[8] = -1;
}

void edge_detect(int image_rgb[786432], int image_gray[262144], int temp_buf[262144], int filter[9], int output[262144])
{
    rgbToGrayscale(image_rgb, image_gray);
    outlined_fun_0(filter);
    convolve2d_rep0(image_gray, filter, output);
    // printf("This is just here to force an external call, don't mind me. Here's a number: %d\n", filter[4]);
    outlined_fun_1(filter);
    convolve2d_rep1(output, filter, image_gray);
    outlined_fun_2(filter);
    convolve2d_rep2(output, filter, temp_buf);
    combthreshold(image_gray, temp_buf, output);
}

int main()
{
    std::ofstream log_file_0;
    log_file_0.open("app_exec_time.csv", std::ios_base::app);
    int image_rgb[786432] = {0};
    int image_gray[262144] = {0};
    int temp_buf[262144] = {0};
    int filter[9] = {0};
    int output[262144] = {0};
    auto start = high_resolution_clock::now();
    std::chrono::high_resolution_clock::time_point clava_timing_start_0;
    std::chrono::high_resolution_clock::time_point clava_timing_end_0;
    clava_timing_start_0 = std::chrono::high_resolution_clock::now();
    edge_detect(image_rgb, image_gray, temp_buf, filter, output);
    clava_timing_end_0 = std::chrono::high_resolution_clock::now();
    long long clava_timing_duration_0 = std::chrono::duration_cast<std::chrono::microseconds>(clava_timing_end_0 - clava_timing_start_0).count();
    log_file_0 << clava_timing_duration_0 << "us" << "\n";
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<microseconds>(stop - start);
    std::cout << "Duration: " << duration.count() << std::endl;
    int actual = 0;
    int real = 2455650;
    for (int i = 0; i < 262144; i++)
    {
        actual += output[i];
    }
    cout << "Checksum: real = " << real << ", actual = " << actual << (real == actual ? " (VERIFIED)" : " (ERROR)") << endl;

    return 0;
}
