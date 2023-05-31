"use strict";

laraImport("clava.Clava");


class UPTUtils {
    static verifySyntax() {
        Clava.pushAst();

        Clava.popAst();
    }
}