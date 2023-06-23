#include <stdio.h>
#include <math.h>

#define N 4096

int foo(int A[N], int B[N])
{
    int sum = 0;

    for (int i = 0; i < N; i++)
    {
        sum += A[i] + B[i];
    }
    return sum;
}

void bar(int A[N], int B[N])
{
    for (int i = 0; i < N; i++)
    {
        A[i] += A[i] * B[i];
    }
}

int fizz(int A[N], int B[N])
{
    int sum = 0;

    for (int i = 0; i < N; i++)
    {
        sum += A[i] * B[i];
    }
    return sum;
}

void buzz(int A[N], int B[N])
{
    for (int i = 0; i < N; i++)
    {
        A[i] -= A[i] * B[i];
    }
}

unsigned int custom_sqrt(unsigned int n)
{
    for (int i = 0; i < 100; i++)
    {
        n = n + i;
    }
    return n;
}

int scenario(int something)
{
    int A[N] = {[0 ... N - 1] = 10};
    int B[N] = {[0 ... N - 1] = 20};
    int C[N] = {[0 ... N - 1] = 30};
    int D[N] = {[0 ... N - 1] = 40};
    int n;

    for (int i = 0; i < N; i++)
    {
        A[i] = i * 2;
    }

    int var1 = foo(A, B);

    n = custom_sqrt(n);

    n = n + 2;
    n = n + n;
    n = sqrt(n);
    n = n * n;

    // Scenario B: extract a set of statements with function calls
    // into their own function

    bar(B, C);
    int var2 = fizz(C, D);
    A[0] = var1;
    A[1] = var2;
    int var3 = foo(A, B);
    buzz(B, D);

    // force a use of some variables
    printf("%d\n", var3);

    int sA = 0;
    int sB = 0;
    int sC = 0;
    int sD = 0;

    for (int i = 0; i < N; i++)
    {
        sA += A[i];
        sB += B[i];
        sC += C[i];
        sD += D[i];
    }
    printf("A - Ex: %d, Ac: %d (%s)\n", 38543358, sA, 38543358 == sA ? "SUCCESS" : "FAILURE");
    printf("B - Ex: %d, Ac: %d (%s)\n", -99041280, sB, -99041280 == sB ? "SUCCESS" : "FAILURE");
    printf("C - Ex: %d, Ac: %d (%s)\n", 122880, sC, 122880 == sC ? "SUCCESS" : "FAILURE");
    printf("D - Ex: %d, Ac: %d (%s)\n", 163840, sD, 163840 == sD ? "SUCCESS" : "FAILURE");
    return 0;
}

int main()
{
    int x = 1 + 2;
    scenario(x);
    x += 3;
    return x;
}