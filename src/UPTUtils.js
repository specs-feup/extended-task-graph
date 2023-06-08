"use strict";

laraImport("clava.Clava");

class UPTUtils {
    static verifySyntax() {
        let valid = true;
        Clava.pushAst();
        try {
            Clava.rebuild();
        }
        catch (e) {
            valid = false;
        }
        Clava.popAst();
        return valid;
    }

    static generateCode(weaveDir, folder) {
        const path = weaveDir + "/" + folder;
        Clava.writeCode(path);
    }

    static matchTemplate(jp, template) {
        const split = template[0].split(" ");
        const type = split[0];
        const cond = split.length == 2 ? split[1] : "none";

        if (!jp.instanceOf(type) && type != "_") {
            return false;
        }
        if (cond == "noassign") {
            if (!jp.instanceOf("binaryOp")) {
                println("[TemplateMatcher] Cannot process condition \"noassign\" on a joinpoint of type " + jp.joinPointType + "; ignoring");
            }
            else {
                if (jp.kind == "assign") {
                    return false;
                }
            }
        }

        for (let i = 1; i < template.length; i++) {
            if (!UPTUtils.matchTemplate(jp.children[i - 1], template[i])) {
                return false;
            }
        }
        return true;
    }
}