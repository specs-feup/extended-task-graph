import { Call, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";

export class ExternalFunctionsMatcher {
    public static readonly mathHFuns = {
        "acos": [
            "double"
        ],
        "acosf": [
            "float"
        ],
        "acoshf": [
            "float"
        ],
        "acoshl": [
            "long double"
        ],
        "acosl": [
            "long double"
        ],
        "asin": [
            "double"
        ],
        "asinf": [
            "float"
        ],
        "asinhf": [
            "float"
        ],
        "asinhl": [
            "long double"
        ],
        "asinl": [
            "long double"
        ],
        "atan": [
            "double"
        ],
        "atan2": [
            "double",
            "double"
        ],
        "atan2f": [
            "float",
            "float"
        ],
        "atan2l": [
            "long double",
            "long double"
        ],
        "atanf": [
            "float"
        ],
        "atanl": [
            "long double"
        ],
        "cbrtf": [
            "float"
        ],
        "cbrtl": [
            "long double"
        ],
        "ceil": [
            "double"
        ],
        "ceilf": [
            "float"
        ],
        "ceill": [
            "long double"
        ],
        "copysign": [
            "double",
            "double"
        ],
        "copysignf": [
            "float",
            "float"
        ],
        "copysignl": [
            "long double",
            "long double"
        ],
        "cos": [
            "double"
        ],
        "cosf": [
            "float"
        ],
        "cosh": [
            "double"
        ],
        "coshf": [
            "float"
        ],
        "coshl": [
            "long double"
        ],
        "cosl": [
            "long double"
        ],
        "exp": [
            "double"
        ],
        "expf": [
            "float"
        ],
        "expl": [
            "long double"
        ],
        "expm1f": [
            "float"
        ],
        "expm1l": [
            "long double"
        ],
        "exp2": [
            "double"
        ],
        "exp2f": [
            "float"
        ],
        "exp2l": [
            "long double"
        ],
        "fabsf": [
            "float"
        ],
        "fabsl": [
            "long double"
        ],
        "floor": [
            "double"
        ],
        "floorf": [
            "float"
        ],
        "floorl": [
            "long double"
        ],
        "fma": [
            "double",
            "double",
            "double"
        ],
        "fmaf": [
            "float",
            "float",
            "float"
        ],
        "fmal": [
            "long double",
            "long double",
            "long double"
        ],
        "fmax": [
            "double",
            "double"
        ],
        "fmaxf": [
            "float",
            "float"
        ],
        "fmaxl": [
            "long double",
            "long double"
        ],
        "fmin": [
            "double",
            "double"
        ],
        "fminf": [
            "float",
            "float"
        ],
        "fminl": [
            "long double",
            "long double"
        ],
        "fmod": [
            "double",
            "double"
        ],
        "fmodf": [
            "float",
            "float"
        ],
        "fmodl": [
            "long double",
            "long double"
        ],
        "frexp": [
            "double",
            "int *"
        ],
        "frexpf": [
            "float",
            "int *"
        ],
        "frexpl": [
            "long double",
            "int *"
        ],
        "hypotf": [
            "float",
            "float"
        ],
        "hypotl": [
            "long double",
            "long double"
        ],
        "ilogbf": [
            "float"
        ],
        "ilogbl": [
            "long double"
        ],
        "ldexp": [
            "double",
            "int"
        ],
        "ldexpf": [
            "float",
            "int"
        ],
        "ldexpl": [
            "long double",
            "int"
        ],
        "lgammaf": [
            "float"
        ],
        "lgammal": [
            "long double"
        ],
        "llrint": [
            "double"
        ],
        "llrintf": [
            "float"
        ],
        "llrintl": [
            "long double"
        ],
        "llround": [
            "double"
        ],
        "llroundf": [
            "float"
        ],
        "llroundl": [
            "long double"
        ],
        "log": [
            "double"
        ],
        "logbf": [
            "float"
        ],
        "logbl": [
            "long double"
        ],
        "logf": [
            "float"
        ],
        "logl": [
            "long double"
        ],
        "log1pf": [
            "float"
        ],
        "log1pl": [
            "long double"
        ],
        "log10": [
            "double"
        ],
        "log10f": [
            "float"
        ],
        "log10l": [
            "long double"
        ],
        "lrint": [
            "double"
        ],
        "lrintf": [
            "float"
        ],
        "lrintl": [
            "long double"
        ],
        "lround": [
            "double"
        ],
        "lroundf": [
            "float"
        ],
        "lroundl": [
            "long double"
        ],
        "modf": [
            "double",
            "double *"
        ],
        "modff": [
            "float",
            "float *"
        ],
        "modfl": [
            "long double",
            "long double *"
        ],
        "nan": [
            "char const *"
        ],
        "nanf": [
            "char const *"
        ],
        "nanl": [
            "char const *"
        ],
        "nearbyint": [
            "double"
        ],
        "nearbyintf": [
            "float"
        ],
        "nearbyintl": [
            "long double"
        ],
        "nextafterf": [
            "float",
            "float"
        ],
        "nextafterl": [
            "long double",
            "long double"
        ],
        "nexttoward": [
            "double",
            "long double"
        ],
        "nexttowardf": [
            "float",
            "long double"
        ],
        "nexttowardl": [
            "long double",
            "long double"
        ],
        "pow": [
            "double",
            "double"
        ],
        "powf": [
            "float",
            "float"
        ],
        "powl": [
            "long double",
            "long double"
        ],
        "remainderf": [
            "float",
            "float"
        ],
        "remainderl": [
            "long double",
            "long double"
        ],
        "remquo": [
            "double",
            "double",
            "int *"
        ],
        "remquof": [
            "float",
            "float",
            "int *"
        ],
        "remquol": [
            "long double",
            "long double",
            "int *"
        ],
        "rintf": [
            "float"
        ],
        "rintl": [
            "long double"
        ],
        "round": [
            "double"
        ],
        "roundf": [
            "float"
        ],
        "roundl": [
            "long double"
        ],
        "scalbln": [
            "double",
            "long"
        ],
        "scalblnf": [
            "float",
            "long"
        ],
        "scalblnl": [
            "long double",
            "long"
        ],
        "sin": [
            "double"
        ],
        "sinf": [
            "float"
        ],
        "sinh": [
            "double"
        ],
        "sinhf": [
            "float"
        ],
        "sinhl": [
            "long double"
        ],
        "sinl": [
            "long double"
        ],
        "sqrt": [
            "double"
        ],
        "sqrtf": [
            "float"
        ],
        "sqrtl": [
            "long double"
        ],
        "tan": [
            "double"
        ],
        "tanf": [
            "float"
        ],
        "tanh": [
            "double"
        ],
        "tanhf": [
            "float"
        ],
        "tanhl": [
            "long double"
        ],
        "tanl": [
            "long double"
        ],
        "tgamma": [
            "double"
        ],
        "tgammaf": [
            "float"
        ],
        "tgammal": [
            "long double"
        ]
    }
    public static readonly stdlibHFuns = {
        "abs": [["int"], ["long"], ["long long"]],
    }
    public static readonly cmathFuns = {
        "floor": ["float"],
    }

    public static readonly cppBuiltins = ["__builtin_memcpy", "operator", "memcpy"];

    public static isFromMathH(funOrCall: FunctionJp | Call): boolean {
        return ExternalFunctionsMatcher.isFromGeneric(funOrCall, ExternalFunctionsMatcher.mathHFuns);
    }

    public static isFromStdlibH(funOrCall: FunctionJp | Call): boolean {
        return ExternalFunctionsMatcher.isFromGeneric(funOrCall, ExternalFunctionsMatcher.stdlibHFuns);
    }

    public static isFromCmath(funOrCall: FunctionJp | Call): boolean {
        return ExternalFunctionsMatcher.isFromGeneric(funOrCall, ExternalFunctionsMatcher.cmathFuns);
    }

    public static isCppBuiltin(funOrCall: FunctionJp | Call): boolean {
        const name = funOrCall.name;
        const builtins = ExternalFunctionsMatcher.cppBuiltins;
        return builtins.some(builtin => name.startsWith(builtin));
    }

    public static isValidExternal(funOrCall: FunctionJp | Call): boolean {
        if (ExternalFunctionsMatcher.isFromMathH(funOrCall)) {
            return true;
        }
        else if (ExternalFunctionsMatcher.isFromStdlibH(funOrCall)) {
            return true;
        }
        else if (ExternalFunctionsMatcher.isFromCmath(funOrCall)) {
            return true;
        }
        else if (ExternalFunctionsMatcher.isCppBuiltin(funOrCall)) {
            return true;
        }
        return false;
    }

    private static isFromGeneric(funOrCall: FunctionJp | Call, funList: Record<string, string[] | string[][]>): boolean {
        const name = funOrCall.name;
        const split = funOrCall.signature.split("(");
        if (split.length < 2) {
            return false;
        }
        const params = split[1].split(")")[0].trim();
        const paramTypes = params.split(",").map(param => param.trim());

        for (const funName in funList) {
            if (name === funName) {
                const sigs = funList[funName];
                const possibleParams = (sigs.length > 0 && Array.isArray(sigs[0])) ?
                    sigs as string[][] : [sigs] as string[][];

                for (const params of possibleParams) {
                    if (params.every((param, index) => { return paramTypes[index] === param; })) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}