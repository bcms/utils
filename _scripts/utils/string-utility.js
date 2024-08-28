/**
 * @typedef {{
 *     toSlug(data: string): string,
 *     toSlugUnderscore(data: string): string,
 *     numberCode(size: number): string,
 *     textBetween(src: string, begin?: string, end?: string): string,
 *     allTextBetween(src: string, begin: string, end: string): string[],
 * }} StringUtility
 */

const sdNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randomNumber(min, max) {
    return parseInt('' + (Math.random() * (max - min) + min));
}

/**
 * @type {StringUtility}
 */
const StringUtility = {
    toSlug(data) {
        return data
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/_/g, '-')
            .replace(/[^a-z0-9---]/g, '');
    },

    toSlugUnderscore(data) {
        return data
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/-/g, '_')
            .replace(/[^a-z0-9_-_]/g, '');
    },

    numberCode(size) {
        if (size < 0) {
            size = 0;
        }
        let code = '';
        for (let i = 0; i < size; i = i + 1) {
            code += sdNumbers[randomNumber(0, sdNumbers.length)];
        }
        return code;
    },

    textBetween(src, begin, end) {
        const startInfo = begin
            ? {
                  index: src.indexOf(begin),
                  length: begin.length,
              }
            : {
                  index: 0,
                  length: 0,
              };
        if (startInfo.index === -1) {
            return '';
        }
        /**
         * @type {{
         *     index: number;
         *     length: number;
         * }}
         */
        const endInfo = end
            ? {
                  index: src.indexOf(end, startInfo.index + startInfo.length),
                  length: end.length,
              }
            : {
                  index: src.length,
                  length: 0,
              };
        if (endInfo.index === -1) {
            return '';
        }
        return src.substring(startInfo.index + startInfo.length, endInfo.index);
    },

    allTextBetween(src, begin, end) {
        /**
         * @type {string[]}
         */
        const output = [];
        const index = {
            begin: src.indexOf(begin, 0),
            end: 0,
        };
        if (index.begin === -1) {
            return [];
        }
        index.end = src.indexOf(end, index.begin);
        if (index.end === -1) {
            return [];
        }
        output.push(src.substring(index.begin + begin.length, index.end));
        // eslint-disable-next-line no-constant-condition
        while (true) {
            index.begin = src.indexOf(begin, index.end);
            if (index.begin === -1) {
                break;
            }
            index.end = src.indexOf(end, index.begin);
            if (index.end === -1) {
                break;
            }
            output.push(src.substring(index.begin + begin.length, index.end));
        }
        return output;
    },
};
