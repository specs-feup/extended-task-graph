"use strict";

class Chalk {
    static styles = {
        reset: '\x1b[0m',
        bold: '\x1b[1m',
        dim: '\x1b[2m',
        italic: '\x1b[3m',
        underline: '\x1b[4m',
        inverse: '\x1b[7m',
        hidden: '\x1b[8m',
        strikethrough: '\x1b[9m',

        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',

        bgBlack: '\x1b[40m',
        bgRed: '\x1b[41m',
        bgGreen: '\x1b[42m',
        bgYellow: '\x1b[43m',
        bgBlue: '\x1b[44m',
        bgMagenta: '\x1b[45m',
        bgCyan: '\x1b[46m',
        bgWhite: '\x1b[47m'
    };

    static style(text, style) {
        return `${this.styles[style]}${text}${this.styles.reset}`;
    }

    static color(text, color) {
        return this.style(text, color);
    }

    static bgColor(text, bgColor) {
        return this.style(text, bgColor);
    }

    static stripColors(text) {
        return text.replace(/\x1b\[\d+m/g, '');
    }
}