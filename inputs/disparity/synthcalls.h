#pragma once
#include <stdarg.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

#ifdef __cplusplus
extern "C"
{
#endif
    // Async data structures
    typedef enum
    {
        ASSERT,
        PUTCHAR,
        FFLUSH,
        PRINTF
    } AsyncCall;

    typedef struct
    {
        size_t size;
        int32_t idx;
        bool is_closed;
    } async_kernel_info;

    typedef struct
    {
        int32_t idx;
        AsyncCall fun;
    } async_host_info;

    typedef struct
    {
        async_kernel_info *kernel_info;
        async_host_info *host_info;
        int8_t* buffer;
    } async_call;

    // Host async functions
    async_call *create_async_call_fixed(AsyncCall fun, unsigned int n_calls);
    async_call *create_async_call_variadic(AsyncCall fun, unsigned int ncalls, unsigned int n_args);
    bool listen_async_assert(async_call *call);
    bool listen_async_putchar(async_call *call);
    bool listen_async_fflush(async_call *call, FILE *stream);
    bool listen_async_printf(async_call *call, const char *format);

    // Kernel async functions
    void call_async_assert(int8_t *buf, async_kernel_info *info, bool is_last, bool condition);
    void call_async_putchar(int8_t *buf, async_kernel_info *info, bool is_last, char c);
    void call_async_fflush(int8_t *buf, async_kernel_info *info, bool is_last);
    void call_async_printf(int8_t *buf, async_kernel_info *info, bool is_last, int64_t *args, size_t n_args);
    void call_async_printf_string(int8_t *buf, async_kernel_info *info, bool is_last, int8_t *str);
    void close_async(async_kernel_info *info);

    // Sync data structures
    typedef enum 
    {
        SQRT,
        POW
    } SyncCall;

    typedef union {
        int64_t *int_arg_buf;
        double *float_arg_buf;
    } sync_args;

    typedef union {
        int64_t int_ret;
        double float_ret;
    } sync_ret;

    typedef struct {
        bool kernel_has_data;
        bool host_has_data;
        bool is_closed;
    } sync_info;

    typedef struct {
        bool args_are_float;
        bool ret_is_float;
        SyncCall fun;
        sync_args args;
        sync_ret ret;
        sync_info *info;
    } sync_call;

    // Host sync functions
    sync_call *create_sync_call_fixed(SyncCall fun);
    sync_call *create_sync_call_variadic(SyncCall fun, unsigned int n_args);
    bool listen_sync_sqrt(sync_call *call);
    bool listen_sync_pow(sync_call *call);

    // Kernel sync functions
    double call_sync_sqrt(double *arg_buf, double *ret_val, sync_info *info, bool is_last, double x);
    double call_sync_pow(double *arg_buf, double *ret_val, sync_info *info, bool is_last, double base, double exponent);
    void close_sync(sync_info *info);

#ifdef __cplusplus
}
#endif
