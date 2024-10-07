export class Chalk {
    static style(text: string, style: ChalkStyle) {
        return `${style}${text}${ChalkStyle.reset}`;
    }

    static color(text: string, color: ChalkColor) {
        return `${color}${text}${ChalkStyle.reset}`;
    }

    static bgColor(text: string, bgColor: ChalkBackground) {
        return `${bgColor}${text}${ChalkStyle.reset}`;
    }

    static stripColors(text: string) {
        return text.replace(/\x1b\[\d+m/g, '');
    }
}

export enum ChalkStyle {
    reset = '\x1b[0m',
    bold = '\x1b[1m',
    dim = '\x1b[2m',
    italic = '\x1b[3m',
    underline = '\x1b[4m',
    inverse = '\x1b[7m',
    hidden = '\x1b[8m',
    strikethrough = '\x1b[9m'
}

export enum ChalkColor {
    black = '\x1b[30m',
    red = '\x1b[31m',
    green = '\x1b[32m',
    yellow = '\x1b[33m',
    blue = '\x1b[34m',
    magenta = '\x1b[35m',
    cyan = '\x1b[36m',
    white = '\x1b[37m',
}

export enum ChalkBackground {
    bgBlack = '\x1b[40m',
    bgRed = '\x1b[41m',
    bgGreen = '\x1b[42m',
    bgYellow = '\x1b[43m',
    bgBlue = '\x1b[44m',
    bgMagenta = '\x1b[45m',
    bgCyan = '\x1b[46m',
    bgWhite = '\x1b[47m'
}