#include <stdlib.h>
#include <stddef.h>
#include <stdbool.h>
#include <string.h>
#include <stdarg.h>
#include <stdio.h>
#include <assert.h>
#include <stdint.h>
#include "synthcalls.h"

static async_call *create_async_call(AsyncCall fun, size_t buffer_size);

async_call *create_async_call_fixed(AsyncCall fun, unsigned int n_calls)
{
    size_t size = 0;
    switch (fun)
    {
    case ASSERT:
        size = sizeof(uint32_t);
        break;
    case PUTCHAR:
        size = sizeof(uint32_t);
        break;
    case FFLUSH:
        size = sizeof(uint32_t);
        break;
    case PRINTF:
        size = sizeof(uint32_t);
        break;
    default:
        break;
    }
    size_t buffer_size = size * n_calls;
    return create_async_call(fun, buffer_size);
}

async_call *create_async_call_variadic(AsyncCall fun, unsigned int ncalls, unsigned int n_args)
{
    size_t size = n_args * sizeof(int64_t);
    size_t buffer_size = size * ncalls;
    return create_async_call(fun, buffer_size);
}

static async_call *create_async_call(AsyncCall fun, size_t buffer_size)
{
    int8_t *buffer = (int8_t *)calloc(1, buffer_size);

    async_kernel_info *kernel_info = (async_kernel_info *)calloc(1, sizeof(async_kernel_info));
    kernel_info->size = buffer_size;
    kernel_info->idx = -1;
    kernel_info->is_closed = false;

    async_host_info *host_info = (async_host_info *)calloc(1, sizeof(async_host_info));
    host_info->idx = -1;
    host_info->fun = fun;

    async_call *call = (async_call *)calloc(1, sizeof(async_call));
    call->kernel_info = kernel_info;
    call->host_info = host_info;
    call->buffer = buffer;

    return call;
}

bool listen_async_assert(async_call *call)
{
    if (call->host_info->idx >= call->kernel_info->idx)
    {
        return !call->kernel_info->is_closed;
    }
    if (call->host_info->idx == -1)
    {
        call->host_info->idx = 0;
    }
    int8_t *curr_ptr = call->buffer + call->host_info->idx;

    int32_t arg = *((int32_t *)curr_ptr);
    //assert(arg);
    printf("Assertion %s with arg %d\n", arg ? "passed" : "failed", arg);

    call->host_info->idx += sizeof(int32_t);
    return true;
}

bool listen_async_putchar(async_call *call)
{
    if (call->host_info->idx >= call->kernel_info->idx)
    {
        return !call->kernel_info->is_closed;
    }
    if (call->host_info->idx == -1)
    {
        call->host_info->idx = 0;
    }
    int8_t *curr_ptr = call->buffer + call->host_info->idx;

    uint32_t arg = *((uint32_t *)curr_ptr);
    putchar(arg);

    call->host_info->idx += sizeof(int32_t);
    return true;
}

bool listen_async_fflush(async_call *call, FILE *stream)
{
    if (call->host_info->idx >= call->kernel_info->idx)
    {
        return !call->kernel_info->is_closed;
    }
    if (call->host_info->idx == -1)
    {
        call->host_info->idx = 0;
    }
    // we don't need to read anything, though there should be a "1" in the buffer

    fflush(stream);

    call->host_info->idx += sizeof(int32_t);
    return true;
}

bool listen_async_printf(async_call *call, const char *format)
{
    if (call->host_info->idx >= call->kernel_info->idx)
    {
        return !call->kernel_info->is_closed;
    }
    if (call->host_info->idx == -1)
    {
        call->host_info->idx = 0;
    }
    int8_t *curr_ptr = call->buffer + call->host_info->idx;
    size_t host_ptr_increment = 0;

    for (size_t i = 0; i < strlen(format); i++)
    {
        char curr_char = format[i];
        if (curr_char != '%')
        {
            putchar(curr_char);
        }
        else if (curr_char == '%' && format[i + 1] == '\0')
        {
            putchar(curr_char);
        }
        else
        {
            int64_t arg = *((int64_t *)(curr_ptr + host_ptr_increment));

            char next_char = format[i + 1];
            switch (next_char)
            {
            case 'd':
            case 'i':
            {
                printf("%d", (int32_t)arg);
                break;
            }
            case 'c':
            {
                printf("%c", (uint8_t)arg);
                break;
            }
            case 'u':
            {
                printf("%u", (uint32_t)arg);
                break;
            }
            case 'l':
            {
                printf("%ld", arg);
                break;
            }
            case 'U':
            {
                printf("%lu", (uint64_t)arg);
                break;
            }
            case 'f':
            {
                printf("%f", (float)arg);
                break;
            }
            case 'p':
            {
                printf("%p", (void *)arg);
                break;
            }
            default:
            {
                printf("%d", (int32_t)arg);
                break;
            }
            }
            host_ptr_increment += sizeof(int64_t);
            i++;
        }
    }
    call->host_info->idx += host_ptr_increment;
    return true;
}