#include <iostream>

#define N 1000
#define M 500

using namespace std;

void useB_defineA(int A[N], int B[M])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = B[i % M];
    }
}

void useA_defineB(int A[N], int B[M])
{
    for (int i = 0; i < N; i++)
    {
        B[i] = A[i % M];
    }
}

void useAB_defineC(int A[N], int B[M], int C[N])
{
    for (int i = 0; i < N; i++)
    {
        C[i] = B[i % M];
    }
    for (int i = 0; i < N; i++)
    {
        C[i] = A[i % M];
    }
}

void app_start(int A[N], int B[M], int C[N])
{
    int D[N * M] = {0};
    int E[N * M] = {0};

    // an innocent first task
    useB_defineA(A, B);

    // Case L1: task in a loop
    for (int i = 0; i < N; i++)
    {
        useB_defineA(A, B);
    }
    useAB_defineC(A, B, C); // require both A and B, to serve as a "stopgap" between each case

    // Case L2: multiple tasks in a loop, with dependencies
    for (int i = 0; i < N; i++)
    {
        useB_defineA(A, B);
        useA_defineB(A, B);
    }
    useAB_defineC(A, B, C);

    // Case L3: loop nesting with calls at different levels
    for (int i = 0; i < N; i++)
    {
        useA_defineB(A, B);
        // L1 repeated
        for (int j = 0; j < M; j++)
        {
            useB_defineA(A, B);
        }
        useA_defineB(A, B);
    }
    useAB_defineC(A, B, C);

    // Case C1: single conditional
    if (A[0] == 1)
    {
        useB_defineA(A, B);
    }
    useAB_defineC(A, B, C);

    // Case C2: if/else, both modifying the same data
    if (A[1] == 2)
    {
        useB_defineA(A, B);
    }
    else
    {
        useB_defineA(A, B);
    }
    useAB_defineC(A, B, C);

    // Case C3: if/else, both modifying different data
    if (A[2] == 3)
    {
        useB_defineA(A, B);
    }
    else
    {
        useA_defineB(A, B);
    }
    useAB_defineC(A, B, C);
}

int main()
{
    int A[N] = {0};
    int B[M] = {0};
    int C[N] = {0};

    app_start(A, B, C);
    return 0;
}
