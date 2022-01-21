export function pathHasVariables(path: string) {
    return !!path.split('/')
        .find(segment => isVariableSegment(segment));
}

export function evaluatePathVariables(template: string, path: string) {

    const templateSegments = template.split('/')
        .filter(seg => seg.length);
    const pathSegments = path.split('/')
        .filter(seg => seg.length);

    // short circuit if clearly no match
    if (templateSegments.length > pathSegments.length) {
        return {
            pathMatchesTemplate: false,
            variables: new Map<string, string>(),
        }
    }

    return pathSegments
        .reduce((acc, cur, idx) => {
            if (!acc.pathMatchesTemplate) {
                return acc;
            }
            const templSeg = templateSegments[idx];
            if (isVariableSegment(templSeg)) {
                acc.variables.set(templSeg.slice(1, templSeg.length - 1), cur);
            } else if (!(cur === templSeg)) {
                acc.pathMatchesTemplate = false;
            }
            return acc;
        }, {
            pathMatchesTemplate: true,
            variables: new Map<string, string>()
        });
}

export function isVariableSegment(segment: string): boolean {
    return /^\{[^\{\}]+\}$/.test(segment);
}

export const tnaHttpVersion = JSON.parse(
    require('fs').readFileSync(__dirname + '/../../package.json').toString()
).version;
