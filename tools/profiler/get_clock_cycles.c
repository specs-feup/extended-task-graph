#include <stdint.h>

uint64_t get_clock_cycles()
{
#ifdef __x86_64__
    uint32_t lo, hi;
    asm volatile("rdtsc" : "=a"(lo), "=d"(hi));
    return ((uint64_t)hi << 32) | lo;

#elif __arm__
    uint32_t value;
    asm volatile("mrc p15, 0, %0, c9, c13, 0" : "=r"(value));
    asm volatile("isb");
    return (uint64_t)value;

#else
#error "Unsupported architecture"
#endif
}