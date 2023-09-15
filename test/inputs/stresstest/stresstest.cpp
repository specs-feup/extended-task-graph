#include <iostream>

#define N 1000
#define M 500

using namespace std;

void externalMcExternalface(int A[N], int B[M]);

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

void clean_conditional_test_1(int A[N], int B[M], int C[N], int x)
{
    useAB_defineC(A, B, C);

    if (x == 1)
    {
        useB_defineA(A, B);
    }

    useAB_defineC(A, B, C);
}

void clean_conditional_test_2(int A[N], int B[M], int C[N], int x)
{
    useAB_defineC(A, B, C);

    if (x == 1)
    {
        useB_defineA(A, B);
    }
    else
    {
        useA_defineB(A, B);
    }

    useAB_defineC(A, B, C);
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

    // Case L4: loop nesting, but worse
    for (int i = 0; i < N; i++)
    {
        useA_defineB(A, B);
        // L1 repeated
        for (int j = 0; j < M; j++)
        {
            useB_defineA(A, B);
            useA_defineB(A, B);
            useAB_defineC(A, B, C);
            for (int k = 0; k < N; k++)
            {
                useB_defineA(A, B);
                useA_defineB(A, B);
            }
            useAB_defineC(A, B, C);
        }
        useA_defineB(A, B);
    }
    useAB_defineC(A, B, C);

    int x = 1;

    clean_conditional_test_1(A, B, C, x);

    clean_conditional_test_2(A, B, C, x);
}

int main()
{
    int A[N] = {0};
    int B[M] = {0};
    int C[N] = {0};

    app_start(A, B, C);
    return 0;
}
