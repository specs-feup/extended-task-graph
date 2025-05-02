#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "bitmap.h"

void padarray4(int inMat_w, int inMat_h, int *inMat_data, int borderMat_w,
               int borderMat_h, int *borderMat_data, int dir,
               int paddedArray_w, int paddedArray_h, int *paddedArray_data)
{
    int rows;
    int cols;
    int bRows;
    int bCols;
    int newRows;
    int newCols;
    int i;
    int j;
    int adir;
    adir = abs(dir);
    rows = (inMat_h);
    cols = (inMat_w);
    bRows = borderMat_data[0];
    bCols = borderMat_data[1];
    newRows = rows + bRows;
    newCols = cols + bCols;
    int decomp_0;
    decomp_0 = dir == 1;

    if (decomp_0)
    {
        for (i = 0; i < rows; i++)
        {
#pragma HLS loop_tripcount min = 488 max = 488
            for (j = 0; j < cols; j++)
            {
#pragma HLS loop_tripcount min = 595 max = 595
                paddedArray_data[(i) * (paddedArray_w) + (j)] =
                    inMat_data[(i) * (inMat_w) + (j)];
            }
        }
    }
    else
    {
        for (i = 0; i < rows - bRows; i++)
        {
#pragma HLS loop_tripcount min = 488 max = 488
            for (j = 0; j < cols - bCols; j++)
            {
#pragma HLS loop_tripcount min = 595 max = 595
                paddedArray_data[((bRows + i)) * (paddedArray_w) + ((bCols + j))] =
                    inMat_data[(i) * (inMat_w) + (j)];
            }
        }
    }

    return;
}

void computeSAD(int Ileft_w, int Ileft_h, int *Ileft_data,
                int Iright_moved_w, int Iright_moved_h, int *Iright_moved_data,
                int SAD_w, int SAD_h, float *SAD_data)
{
    int rows;
    int cols;
    int i;
    int j;
    int diff;
    rows = Ileft_h;
    cols = Ileft_w;

    for (i = 0; i < rows; i++)
    {
#pragma HLS loop_tripcount min = 488 max = 488
        for (j = 0; j < cols; j++)
        {
#pragma HLS loop_tripcount min = 595 max = 595
            diff = Ileft_data[(i) * (Ileft_w) + (j)] -
                   Iright_moved_data[(i) * (Iright_moved_w) + (j)];
            SAD_data[(i) * (SAD_w) + (j)] = diff * diff;
        }
    }
    return;
}

void integralImage2D2D(int SAD_w, int SAD_h, float *SAD_data,
                       int integralImg_w, int integralImg_h, float *integralImg_data)
{
    int nr;
    int nc;
    int i;
    int j;
    nr = (SAD_h);
    nc = (SAD_w);

    for (i = 0; i < nc; i++)
    {
#pragma HLS loop_tripcount min = 595 max = 595
        integralImg_data[(0) * (integralImg_w) + (i)] =
            SAD_data[(0) * (SAD_w) + (i)];
    }
    for (i = 1; i < nr; i++)
    {
#pragma HLS loop_tripcount min = 488 max = 488
        for (j = 0; j < nc; j++)
        {
#pragma HLS loop_tripcount min = 595 max = 595
            integralImg_data[(i) * (integralImg_w) + (j)] =
                integralImg_data[((i - 1)) * (integralImg_w) + (j)] +
                SAD_data[(i) * (SAD_w) + (j)];
        }
    }
    for (i = 0; i < nr; i++)
    {
#pragma HLS loop_tripcount min = 488 max = 488
        for (j = 1; j < nc; j++)
        {
#pragma HLS loop_tripcount min = 595 max = 595
            integralImg_data[(i) * (integralImg_w) + (j)] =
                integralImg_data[(i) * (integralImg_w) + ((j - 1))] +
                integralImg_data[(i) * (integralImg_w) + (j)];
        }
    }

    return;
}

void finalSAD(int integralImg_w, int integralImg_h, float *integralImg_data,
              int win_sz,
              int retSAD_w, int retSAD_h, float *retSAD_data)
{
    int endR;
    int endC;
    int i;
    int j;
    int k;
    endR = (integralImg_h);
    endC = (integralImg_w);
    k = 0;

    for (j = 0; j < (endC - win_sz); j++)
    {
#pragma HLS loop_tripcount min = 587 max = 587
        for (i = 0; i < (endR - win_sz); i++)
        {
#pragma HLS loop_tripcount min = 480 max = 480
            retSAD_data[(i) * (retSAD_w) + (j)] =
                integralImg_data[((win_sz + i)) * (integralImg_w) + ((j + win_sz))] +
                integralImg_data[((i + 1)) * (integralImg_w) + ((j + 1))] -
                integralImg_data[((i + 1)) * (integralImg_w) + ((j + win_sz))] -
                integralImg_data[((win_sz + i)) * (integralImg_w) + ((j + 1))];
        }
    }

    return;
}

void outlined_fun_18(int range_w, int range_h, int *range_data,
                     int disparity, int *rows, int Iright_moved_w,
                     int Iright_moved_h, int *Iright_moved_data,
                     int *cols, int *i)
{
    range_data[(0) * (range_w) + (0)] = 0;
    range_data[(0) * (range_w) + (1)] = (disparity);
    (*rows) = (Iright_moved_h);
    (*cols) = (Iright_moved_w);
    for ((*i) = 0; (*i) < (*rows) * (*cols); (*i)++)
    {
#pragma HLS loop_tripcount min = 290360 max = 290360
        Iright_moved_data[(*i)] = 0;
    }
}

void correlateSAD_2D(int Ileft_w, int Ileft_h, int *Ileft_data,
                     int Iright_w, int Iright_h, int *Iright_data,
                     int Iright_moved_w, int Iright_moved_h, int *Iright_moved_data,
                     int win_sz,
                     int disparity,
                     int SAD_w, int SAD_h, float *SAD_data,
                     int integralImg_w, int integralImg_h, float *integralImg_data,
                     int retSAD_w, int retSAD_h, float *retSAD_data,
                     int *range_data)
{
    int rows;
    int cols;
    int i;
    int j;
    int endRM;
    outlined_fun_18(1, 2, range_data,
                    disparity, &rows,
                    Iright_moved_w, Iright_moved_h, Iright_moved_data,
                    &cols, &i);

    padarray4(Iright_w, Iright_h, Iright_data,
              1, 2, range_data,
              -1,
              Iright_moved_w, Iright_moved_h, Iright_moved_data);

    computeSAD(Ileft_w, Ileft_h, Ileft_data,
               Iright_moved_w, Iright_moved_h, Iright_moved_data,
               SAD_w, SAD_h, SAD_data);

    integralImage2D2D(SAD_w, SAD_h, SAD_data,
                      integralImg_w, integralImg_h, integralImg_data);

    finalSAD(integralImg_w, integralImg_h, integralImg_data,
             win_sz,
             retSAD_w, retSAD_h, retSAD_data);

    return;
}

void findDisparity(int retSAD_w, int retSAD_h, float *retSAD_data,
                   int minSAD_w, int minSAD_h, float *minSAD_data,
                   int retDisp_w, int retDisp_h, int *retDisp_data,
                   int level, int nr, int nc)
{
    int i;
    int j;
    int a;
    int b;

    for (i = 0; i < nr; i++)
    {
#pragma HLS loop_tripcount min = 480 max = 480
        for (j = 0; j < nc; j++)
        {
#pragma HLS loop_tripcount min = 587 max = 587
            a = retSAD_data[(i) * (retSAD_w) + (j)];
            b = minSAD_data[(i) * (minSAD_w) + (j)];
            int decomp_0;
            decomp_0 = a < b;
            if (decomp_0)
            {
                minSAD_data[(i) * (minSAD_w) + (j)] = a;
                retDisp_data[(i) * (retDisp_w) + (j)] = level;
            }
        }
    }

    return;
}

void outlined_loop_0(int Ileft_w, int Ileft_h, int *Ileft_data,
                     int Iright_w, int Iright_h, int *Iright_data,
                     int Iright_moved_w, int Iright_moved_h, int *Iright_moved_data,
                     int win_sz, int disparity,
                     int SAD_w, int SAD_h, float *SAD_data,
                     int integralImg_w, int integralImg_h, float *integralImg_data,
                     int retSAD_w, int retSAD_h, float *retSAD_data,
                     int minSAD_w, int minSAD_h, float *minSAD_data,
                     int retDisp_w, int retDisp_h, int *retDisp_data,
                     int nr, int nc,
                     int *range_data)
{
    correlateSAD_2D(Ileft_w, Ileft_h, Ileft_data,
                    Iright_w, Iright_h, Iright_data,
                    Iright_moved_w, Iright_moved_h, Iright_moved_data,
                    win_sz, disparity,
                    SAD_w, SAD_h, SAD_data,
                    integralImg_w, integralImg_h, integralImg_data,
                    retSAD_w, retSAD_h, retSAD_data,
                    range_data);

    findDisparity(retSAD_w, retSAD_h, retSAD_data,
                  minSAD_w, minSAD_h, minSAD_data,
                  retDisp_w, retDisp_h, retDisp_data,
                  disparity, nr, nc);
}

void outer_region(int Ileft_w, int Ileft_h, int *Ileft_data,
                  int Iright_w, int Iright_h, int *Iright_data,
                  int Iright_moved_w, int Iright_moved_h, int *Iright_moved_data,
                  int win_sz, int disparity,
                  int SAD_w, int SAD_h, float *SAD_data,
                  int integralImg_w, int integralImg_h, float *integralImg_data,
                  int retSAD_w, int retSAD_h, float *retSAD_data,
                  int minSAD_w, int minSAD_h, float *minSAD_data,
                  int retDisp_w, int retDisp_h, int *retDisp_data,
                  int nr, int nc,
                  int *range_data,
                  int max_shift)
{
    int k;
    for (k = 0; k < max_shift; k++)
    {
#pragma HLS loop_tripcount min = 64 max = 64
        outlined_loop_0(Ileft_w, Ileft_h, Ileft_data,
                        Iright_w, Iright_h, Iright_data,
                        Iright_moved_w, Iright_moved_h, Iright_moved_data,
                        win_sz, k,
                        SAD_w, SAD_h, SAD_data,
                        integralImg_w, integralImg_h, integralImg_data,
                        retSAD_w, retSAD_h, retSAD_data,
                        minSAD_w, minSAD_h, minSAD_data,
                        retDisp_w, retDisp_h, retDisp_data,
                        nr, nc,
                        range_data);
    }
}

void outer_region_static_malloc(int Ileft_w, int Ileft_h, int *Ileft_data,
                     int Iright_w, int Iright_h, int *Iright_data,
                     int Iright_moved_w, int Iright_moved_h, int *Iright_moved_data,
                     int win_sz, int k,
                     int SAD_w, int SAD_h, float *SAD_data,
                     int integralImg_w, int integralImg_h, float *integralImg_data,
                     int minSAD_w, int minSAD_h, float *minSAD_data,
                     int retDisp_w, int retDisp_h, int *retDisp_data,
                     int nr, int nc,
                     int max_shift)
{
    float retSAD_data[595 * 488];
    int range_data[2] = {0};
    outer_region(Ileft_w, Ileft_h, Ileft_data,
                 Iright_w, Iright_h, Iright_data,
                 Iright_moved_w, Iright_moved_h, Iright_moved_data,
                 win_sz, k,
                 SAD_w, SAD_h, SAD_data,
                 integralImg_w, integralImg_h, integralImg_data,
                 595, 488, retSAD_data,
                 minSAD_w, minSAD_h, minSAD_data,
                 retDisp_w, retDisp_h, retDisp_data,
                 nr, nc,
                 range_data,
                 max_shift);
}

void getDisparity(int Ileft_w, int Ileft_h, int *Ileft_data,
                  int Iright_w, int Iright_h, int *Iright_data,
                  int win_sz, int max_shift,
                  int retDisp_w, int retDisp_h, int *retDisp_data)
{
    int nr = Ileft_h;
    int nc = Ileft_w;
    int half_win_sz = win_sz / 2;
    int cols;
    int rows;
    int k;

    // I2D *halfWin;
    int halfWin_w = 1;
    int halfWin_h = 2;
    int *halfWin_data = (int *)malloc(sizeof(int) * halfWin_w * halfWin_h);
    halfWin_data[0] = 1;
    halfWin_data[1] = 2;

    // I2D *Iright_moved;
    int Iright_moved_w = 595;
    int Iright_moved_h = 488;
    int *Iright_moved_data = (int *)malloc(sizeof(int) * Iright_moved_w * Iright_moved_h);

    // I2D *IleftPadded;

    // I2D *IrightPadded;

    // F2D *SAD;
    int SAD_w = 595;
    int SAD_h = 488;
    float *SAD_data = (float *)malloc(sizeof(float) * SAD_w * SAD_h);
    for (int i = 0; i < SAD_w * SAD_h; i++)
    {
        SAD_data[i] = 255.0;
    }

    // F2D *integralImg;
    int integralImg_w = 595;
    int integralImg_h = 488;
    float *integralImg_data = (float *)malloc(sizeof(float) * integralImg_w * integralImg_h);
    for (int i = 0; i < integralImg_w * integralImg_h; i++)
    {
        integralImg_data[i] = 0.0;
    }

    // F2D *retSAD;
    int retSAD_w = 595;
    int retSAD_h = 488;
    float *retSAD_data = (float *)malloc(sizeof(float) * retSAD_w * retSAD_h);

    // F2D *minSAD;
    int minSAD_w = nc;
    int minSAD_h = nr;
    float *minSAD_data = (float *)malloc(sizeof(float) * minSAD_w * minSAD_h);
    for (int i = 0; i < minSAD_w * minSAD_h; i++)
    {
        minSAD_data[i] = 65025.0;
    }

    // I2D *retDisp;
    for (int i = 0; i < retDisp_w * retDisp_h; i++)
    {
        retDisp_data[i] = max_shift;
    }

    
    outer_region_static_malloc(Ileft_w, Ileft_h, Ileft_data,
                     Iright_w, Iright_h, Iright_data,
                      Iright_moved_w,  Iright_moved_h,  Iright_moved_data,
                      win_sz,  k,
                      SAD_w,  SAD_h,  SAD_data,
                      integralImg_w,  integralImg_h,  integralImg_data,
                      minSAD_w,  minSAD_h,  minSAD_data,
                      retDisp_w,  retDisp_h,  retDisp_data,
                      nr,  nc,
                      max_shift);
    return;
}

int main(int argc, char **argv)
{
    int Ileft_w = 587;
    int Ileft_h = 480;
    // int *Ileft_data = (int *)malloc(sizeof(int) * Ileft_w * Ileft_h);
    int *Ileft_data = readBMP("./1.bmp", &Ileft_w, &Ileft_h);

    int Iright_w = 587;
    int Iright_h = 480;
    // int *Iright_data = (int *)malloc(sizeof(int) * Iright_w * Iright_h);
    int *Iright_data = readBMP("./2.bmp", &Iright_w, &Iright_h);

    int retDisp_w = 595;
    int retDisp_h = 488;
    int *retDisp_data = (int *)malloc(sizeof(int) * retDisp_w * retDisp_h);

    int WIN_SZ = 8;
    int SHIFT = 64;

    getDisparity(Ileft_w, Ileft_h, Ileft_data,
                 Iright_w, Iright_h, Iright_data,
                 WIN_SZ, SHIFT,
                 retDisp_w, retDisp_h, retDisp_data);

    long sum = 0;
    for (int i = 0; i < retDisp_w * retDisp_h; i++)
    {
        sum += retDisp_data[i];
    }
    printf("sum = %ld\n", sum);

    writeBMP("./output.bmp", retDisp_w, retDisp_h, retDisp_data);
    return 0;
}