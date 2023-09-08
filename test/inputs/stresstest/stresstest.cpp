#include <iostream>

#define N 1000
#define M 500

using namespace std;

void funA(int A[N], int D[N * M], int E[N * M])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = D[i * M + i];
        A[i] = E[i * M + i];
    }
}

void funB(int A[N], int D[N * M], int E[N * M])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = D[i * M + i];
        A[i] = E[i * M + i];
    }
}

void funC(int A[N], int B[M])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = B[i % M];
    }
}

void funD(int A[N], int B[M], int C[N])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = B[i % M];
        A[i] = C[i];
    }
}

void funE(int A[N], int B[M], int C[N])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = B[i % M];
        A[i] = C[i];
    }
}

void funF(int A[N], int B[M], int C[N])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = B[i % M];
        A[i] = C[i];
    }
}

void funG(int A[N], int B[M], int C[N])
{
    for (int i = 0; i < N; i++)
    {
        A[i] = B[i % M];
        A[i] = C[i];
    }
}

void app_start(int A[N], int B[M], int C[N])
{
    int D[N * M] = {0};
    int E[N * M] = {0};

    funA(A, D, E);
    funB(A, D, A);

    // Case A: task is repeated N times
    for (int i = 0; i < N; i++)
    {
        funC(A, B);
    }

    for (int i = 0; i < N; i++)
    {
        funD(A, B, C);
        for (int j = 0; j < M; j++)
        {
            funE(A, B, C);
        }
        funD(A, B, C);
    }

    if (A[1] == 2)
    {
        funF(A, B, C);
    }
    else
    {
        funG(A, B, C);
    }
}

int main()
{
    int A[N] = {0};
    int B[M] = {0};
    int C[N] = {0};

    app_start(A, B, C);
    return 0;
}
