#include <math.h>
#include <stdio.h>
#include <stdlib.h>

// from padarray4.c
void padarray4(int *inMat_w, int *inMat_h, int *inMat_data, int *borderMat_w,
               int *borderMat_h, int *borderMat_data, int dir,
               int *paddedArray_w, int *paddedArray_h, int *paddedArray_data)
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
    rows = (*inMat_h);
    cols = (*inMat_w);
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
                paddedArray_data[(i) * (*paddedArray_w) + (j)] =
                    inMat_data[(i) * (*inMat_w) + (j)];
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
                paddedArray_data[((bRows + i)) * (*paddedArray_w) + ((bCols + j))] =
                    inMat_data[(i) * (*inMat_w) + (j)];
            }
        }
    }

    return;
}

// from computeSAD.c
void computeSAD(/*I2D Ileft,*/ int *Ileft_w, int *Ileft_h, int *Ileft_data,
                /*I2D *Iright_moved,*/ int *Iright_moved_w, int *Iright_moved_h,
                int *Iright_moved_data,
                /*F2D *SAD*/ int *SAD_w, int *SAD_h, int *SAD_data)
{
    int rows;
    int cols;
    int i;
    int j;
    int diff;
    rows = *Ileft_h;
    cols = *Ileft_w;

    for (i = 0; i < rows; i++)
    {
#pragma HLS loop_tripcount min = 488 max = 488
        for (j = 0; j < cols; j++)
        {
#pragma HLS loop_tripcount min = 595 max = 595
            diff = Ileft_data[(i) * (*Ileft_w) + (j)] -
                   Iright_moved_data[(i) * (*Iright_moved_w) + (j)];
            SAD_data[(i) * (*SAD_w) + (j)] = diff * diff;
        }
    }
    return;
}

// from integralImage2D2D.c
void integralImage2D2D(int *SAD_w, int *SAD_h, int *SAD_data,
                       int *integralImg_w, int *integralImg_h,
                       int *integralImg_data)
{
    int nr;
    int nc;
    int i;
    int j;
    nr = (*SAD_h);
    nc = (*SAD_w);

    for (i = 0; i < nc; i++)
    {
#pragma HLS loop_tripcount min = 595 max = 595
        integralImg_data[(0) * (*integralImg_w) + (i)] =
            SAD_data[(0) * (*SAD_w) + (i)];
    }
    for (i = 1; i < nr; i++)
    {
#pragma HLS loop_tripcount min = 488 max = 488
        for (j = 0; j < nc; j++)
        {
#pragma HLS loop_tripcount min = 595 max = 595
            integralImg_data[(i) * (*integralImg_w) + (j)] =
                integralImg_data[((i - 1)) * (*integralImg_w) + (j)] +
                SAD_data[(i) * (*SAD_w) + (j)];
        }
    }
    for (i = 0; i < nr; i++)
    {
#pragma HLS loop_tripcount min = 488 max = 488
        for (j = 1; j < nc; j++)
        {
#pragma HLS loop_tripcount min = 595 max = 595
            integralImg_data[(i) * (*integralImg_w) + (j)] =
                integralImg_data[(i) * (*integralImg_w) + ((j - 1))] +
                integralImg_data[(i) * (*integralImg_w) + (j)];
        }
    }

    return;
}

// from finalSAD.c
void finalSAD(/*F2D *integralImg,*/ int *integralImg_w, int *integralImg_h,
              int *integralImg_data, int win_sz,
              /*F2D *retSAD*/ int *retSAD_w, int *retSAD_h, int *retSAD_data)
{
    int endR;
    int endC;
    int i;
    int j;
    int k;
    endR = (*integralImg_h);
    endC = (*integralImg_w);
    k = 0;

    for (j = 0; j < (endC - win_sz); j++)
    {
#pragma HLS loop_tripcount min = 587 max = 587
        for (i = 0; i < (endR - win_sz); i++)
        {
#pragma HLS loop_tripcount min = 480 max = 480
            retSAD_data[(i) * (*retSAD_w) + (j)] =
                integralImg_data[((win_sz + i)) * (*integralImg_w) + ((j + win_sz))] +
                integralImg_data[((i + 1)) * (*integralImg_w) + ((j + 1))] -
                integralImg_data[((i + 1)) * (*integralImg_w) + ((j + win_sz))] -
                integralImg_data[((win_sz + i)) * (*integralImg_w) + ((j + 1))];
        }
    }

    return;
}

void outlined_fun_18(int *range_w, int *range_h, int *range_data,
                     int *disparity, int *rows, int *Iright_moved_w,
                     int *Iright_moved_h, int *Iright_moved_data, int *cols,
                     int *i)
{
    range_data[(0) * (*range_w) + (0)] = 0;
    range_data[(0) * (*range_w) + (1)] = (*disparity);
    (*rows) = (*Iright_moved_h);
    (*cols) = (*Iright_moved_w);
    for ((*i) = 0; (*i) < (*rows) * (*cols); (*i)++)
    {
#pragma HLS loop_tripcount min = 290360 max = 290360
        Iright_moved_data[(*i)] = 0;
    }
}

void iMallocHandle_rep1(int *range_w, int *range_h, int **range_data)
{
    *range_w = 1;
    *range_h = 2;
    *range_data = (int *)malloc(sizeof(int) * (*range_w) * (*range_h));
}

void iFreeHandle_rep4(int **range_data) { free(*range_data); }

void correlateSAD_2D(int *Ileft_w, int *Ileft_h, int *Ileft_data, int *Iright_w,
                     int *Iright_h, int *Iright_data, int *Iright_moved_w,
                     int *Iright_moved_h, int *Iright_moved_data, int win_sz,
                     int disparity, int *SAD_w, int *SAD_h, int *SAD_data,
                     int *integralImg_w, int *integralImg_h,
                     int *integralImg_data, int *retSAD_w, int *retSAD_h,
                     int *retSAD_data
#ifndef FORCE_MALLOC
                     ,
                     int range_w, int range_h, int range_data[2]
#endif
)
{
    int rows;
    int cols;
    int i;
    int j;
    int endRM;

#ifdef FORCE_MALLOC
    int range_w;
    int range_h;
    int *range_data;
    iMallocHandle_rep1(&range_w, &range_h, &range_data);
#endif

    outlined_fun_18(&range_w, &range_h, range_data, &disparity, &rows, Iright_w,
                    Iright_h, Iright_data, &cols, &i);
    padarray4(Iright_w, Iright_h, Iright_data, &range_w, &range_h, range_data, -1,
              Iright_moved_w, Iright_moved_h, Iright_moved_data);
    computeSAD(Ileft_w, Ileft_h, Ileft_data, Iright_moved_w, Iright_moved_h,
               Iright_moved_data, SAD_w, SAD_h, SAD_data);
    integralImage2D2D(SAD_w, SAD_h, SAD_data, integralImg_w, integralImg_h,
                      integralImg_data);
    finalSAD(integralImg_w, integralImg_h, integralImg_data, win_sz, retSAD_w,
             retSAD_h, retSAD_data);

#ifdef FORCE_MALLOC
    iFreeHandle_rep4(range_data);
#endif

    return;
}

// from findDisparity.c
void findDisparity(int *retSAD_w, int *retSAD_h, int *retSAD_data,
                   int *minSAD_w, int *minSAD_h, int *minSAD_data,
                   int *retDisp_w, int *retDisp_h, int *retDisp_data, int level,
                   int nr, int nc)
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
            a = retSAD_data[(i) * (*retSAD_w) + (j)];
            b = minSAD_data[(i) * (*minSAD_w) + (j)];
            int decomp_0;
            decomp_0 = a < b;
            if (decomp_0)
            {
                minSAD_data[(i) * (*minSAD_w) + (j)] = a;
                retDisp_data[(i) * (*retDisp_w) + (j)] = level;
            }
        }
    }

    return;
}

// adapted from getDisparity.c
void top_level(int *Ileft_w, int *Ileft_h, int *Ileft_data, int *Iright_w,
               int *Iright_h, int *Iright_data, int *Iright_moved_w,
               int *Iright_moved_h, int *Iright_moved_data, int win_sz,
               int *SAD_w, int *SAD_h, int *SAD_data, int *integralImg_w,
               int *integralImg_h, int *integralImg_data, int *retSAD_w,
               int *retSAD_h, int *retSAD_data, int *minSAD_w, int *minSAD_h,
               int *minSAD_data, int *retDisp_w, int *retDisp_h,
               int *retDisp_data, int nr, int nc
#ifndef FORCE_MALLOC
               ,
               int range_w, int range_h, int range_data[2]
#endif
)
{
    for (int disparity = 0; disparity < 64; disparity++)
    {
        correlateSAD_2D(Ileft_w, Ileft_h, Ileft_data, Iright_w, Iright_h,
                        Iright_data, Iright_moved_w, Iright_moved_h,
                        Iright_moved_data, win_sz, disparity, SAD_w, SAD_h,
                        SAD_data, integralImg_w, integralImg_h, integralImg_data,
                        retSAD_w, retSAD_h, retSAD_data
#ifndef FORCE_MALLOC
                        ,
                        range_w, range_h, range_data
#endif
        );
        findDisparity(retSAD_w, retSAD_h, retSAD_data, minSAD_w, minSAD_h,
                      minSAD_data, retDisp_w, retDisp_h, retDisp_data, disparity,
                      nr, nc);
    }
}
