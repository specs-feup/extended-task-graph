void foo(int *A, int *B, int n)
{
    for (int i = 0; i < n; i++)
    {
        A[i] = B[i];
    }
}

void bar(int *A, int *B, int n)
{
    for (int i = 0; i < n; i++)
    {
        A[i] = B[i];
    }
}

void fizz(int *A, int *B, int n)
{
    for (int i = 0; i < n; i++)
    {
        A[i] = B[i];
    }
}

void buzz(int *A, int *B, int n)
{
    for (int i = 0; i < n; i++)
    {
        A[i] = B[i];
    }
}

void fizzbuzz(int *A, int *B, int n)
{
    fizz(A, B, n);
    buzz(A, B, n);
}

void start(int *A, int *B, int n)
{
    foo(A, B, n);
    fizzbuzz(A, B, n);
    bar(A, B, n);
}

int main()
{
    int n = 10;
    int A[n];
    int B[n];
    for (int i = 0; i < n; i++)
    {
        A[i] = i;
        B[i] = n - i;
    }
    start(A, B, n);
    return 0;
}