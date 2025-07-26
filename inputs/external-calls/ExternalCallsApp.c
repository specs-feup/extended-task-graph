#include <stdio.h>
#include <stdlib.h>

void matmul(int *a, int *b, int *c, int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            c[i * n + j] = 0;
            for (int k = 0; k < n; k++)
            {
                c[i * n + j] += a[i * n + k] * b[k * n + j];
            }
        }
    }
}

int *allocateMatrixToZero(int n)
{
    int *matrix = (int *)malloc(n * n * sizeof(int));
    for (int i = 0; i < n * n; i++)
    {
        matrix[i] = 0;
    }
    return matrix;
}

void freeMatrix(int *matrix)
{
    free(matrix);
}

void mutliplyNSizes(int n)
{
    int *a = allocateMatrixToZero(n);
    int *b = allocateMatrixToZero(n);
    int *c = allocateMatrixToZero(n);

    // Initialize matrices a and b with some values
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            a[i * n + j] = i + j; // Example initialization
            b[i * n + j] = i - j; // Example initialization
        }
    }

    matmul(a, b, c, n);

    // Free allocated memory
    freeMatrix(a);
    freeMatrix(b);
    freeMatrix(c);
}

int main()
{
    int n = 3; // Example size
    mutliplyNSizes(n);
    return 0;
}