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

int *incrementAndDuplicate(int *m, int n)
{
    for (int i = 0; i < n * n; i++)
    {
        m[i] = m[i] + 1;
    }

    int *newMatrix = (int *)malloc(n * n * sizeof(int));

    for (int i = 0; i < n * n; i++)
    {
        m[i] = newMatrix[i];
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

void bar(int x)
{
    for (int i = 0; i < x; i++)
    {
        x += i % 2;
    }
}

void foo(int x)
{
    for (int i = 0; i < x; i++)
    {
        x += i % 2;
    }
    bar(x);
    for (int i = 0; i < x; i++)
    {
        x += i % 2;
    }
}

void doWork(int n)
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

    int *d = incrementAndDuplicate(c, n);

    // Free allocated memory
    freeMatrix(a);
    freeMatrix(b);
    freeMatrix(c);
    freeMatrix(d);

    int x = 2;
    foo(x);
}

void mutliplyNSizes(int n)
{
    doWork(n);
}

int main()
{
    int n = 3; // Example size
    mutliplyNSizes(n);
    return 0;
}