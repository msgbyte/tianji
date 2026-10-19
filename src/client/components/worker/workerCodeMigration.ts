const LEGACY_FUNCTION_DECLARATION =
  /\b(?:export\s+)?(?:async\s+)?function\s+fetch\s*\(/g;
const LEGACY_FUNCTION_VARIABLE =
  /\b(?:export\s+)?(?:const|let|var)\s+fetch\s*=\s*/g;

type LegacyEntry =
  | {
      kind: 'declaration';
      start: number;
      end: number;
      source: string;
    }
  | {
      kind: 'variable';
      start: number;
      end: number;
      initializerStart: number;
      initializerEnd: number;
    };

function isRegexStart(code: string, index: number) {
  const before = code.slice(0, index).trimEnd();
  if (before.length === 0) {
    return true;
  }

  const previous = before.at(-1) as string;
  if ('([{:;,=!?&|+-*%^~<>'.includes(previous)) {
    return true;
  }

  return /\b(?:return|throw|case|delete|typeof|void|yield|await)$/.test(before);
}

/**
 * Mask strings, comments, template literals, and regular expressions while
 * preserving offsets and structural punctuation used by the migration scan.
 */
function maskNonCode(code: string) {
  const masked = code.split('');

  for (let index = 0; index < code.length; index += 1) {
    const char = code[index];
    const next = code[index + 1];
    let end = index;

    if (char === '/' && next === '/') {
      end = code.indexOf('\n', index + 2);
      if (end === -1) end = code.length;
    } else if (char === '/' && next === '*') {
      const close = code.indexOf('*/', index + 2);
      end = close === -1 ? code.length : close + 2;
    } else if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      end = index + 1;
      while (end < code.length) {
        if (code[end] === '\\') {
          end += 2;
          continue;
        }
        if (code[end] === quote) {
          end += 1;
          break;
        }
        end += 1;
      }
    } else if (char === '/' && isRegexStart(code, index)) {
      end = index + 1;
      let inCharacterClass = false;
      while (end < code.length) {
        if (code[end] === '\\') {
          end += 2;
          continue;
        }
        if (code[end] === '[') inCharacterClass = true;
        if (code[end] === ']') inCharacterClass = false;
        if (code[end] === '/' && !inCharacterClass) {
          end += 1;
          while (/[A-Za-z]/.test(code[end] ?? '')) end += 1;
          break;
        }
        end += 1;
      }
    } else {
      continue;
    }

    for (let maskedIndex = index; maskedIndex < end; maskedIndex += 1) {
      if (masked[maskedIndex] !== '\n') masked[maskedIndex] = ' ';
    }
    index = end - 1;
  }

  return masked.join('');
}

function getDepthAt(code: string, end: number) {
  let curly = 0;
  let round = 0;
  let square = 0;

  for (let index = 0; index < end; index += 1) {
    if (code[index] === '{') curly += 1;
    if (code[index] === '}') curly -= 1;
    if (code[index] === '(') round += 1;
    if (code[index] === ')') round -= 1;
    if (code[index] === '[') square += 1;
    if (code[index] === ']') square -= 1;
  }

  return { curly, round, square };
}

function isTopLevel(code: string, index: number) {
  const depth = getDepthAt(code, index);
  return depth.curly === 0 && depth.round === 0 && depth.square === 0;
}

function findMatchingDelimiter(
  code: string,
  openIndex: number,
  open: string,
  close: string
) {
  let depth = 0;
  for (let index = openIndex; index < code.length; index += 1) {
    if (code[index] === open) depth += 1;
    if (code[index] === close) depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

function findLegacyEntry(code: string): LegacyEntry | undefined {
  const masked = maskNonCode(code);

  for (const match of masked.matchAll(LEGACY_FUNCTION_DECLARATION)) {
    const start = match.index as number;
    if (!isTopLevel(masked, start)) continue;

    const openParen = masked.indexOf('(', start);
    const closeParen = findMatchingDelimiter(masked, openParen, '(', ')');
    if (closeParen === -1) continue;

    const openBrace = masked.indexOf('{', closeParen + 1);
    if (openBrace === -1) continue;
    const closeBrace = findMatchingDelimiter(masked, openBrace, '{', '}');
    if (closeBrace === -1) continue;

    const source = code
      .slice(start, closeBrace + 1)
      .replace(/^export\s+/, '');
    return {
      kind: 'declaration',
      start,
      end: closeBrace + 1,
      source,
    };
  }

  for (const match of masked.matchAll(LEGACY_FUNCTION_VARIABLE)) {
    const start = match.index as number;
    if (!isTopLevel(masked, start)) continue;

    const initializerStart = start + match[0].length;
    let curly = 0;
    let round = 0;
    let square = 0;
    let initializerEnd = -1;

    for (let index = initializerStart; index < masked.length; index += 1) {
      const char = masked[index];
      if (char === '{') curly += 1;
      if (char === '}') curly -= 1;
      if (char === '(') round += 1;
      if (char === ')') round -= 1;
      if (char === '[') square += 1;
      if (char === ']') square -= 1;
      if (char === ';' && curly === 0 && round === 0 && square === 0) {
        initializerEnd = index;
        break;
      }
    }

    // Without a terminator we cannot distinguish the initializer from a
    // following ASI-separated statement without a full JavaScript parser.
    if (initializerEnd === -1) continue;
    if (initializerEnd <= initializerStart) continue;

    return {
      kind: 'variable',
      start,
      end: initializerEnd + 1,
      initializerStart,
      initializerEnd,
    };
  }

  return undefined;
}

export function hasModuleWorkerEntry(code: string) {
  return /\bexport\s+default\b/.test(maskNonCode(code));
}

export function canMigrateLegacyWorkerCode(code: string) {
  return !hasModuleWorkerEntry(code) && findLegacyEntry(code) !== undefined;
}

export function migrateLegacyWorkerCode(code: string) {
  if (hasModuleWorkerEntry(code)) return code;

  const entry = findLegacyEntry(code);
  if (!entry) return code;

  if (entry.kind === 'declaration') {
    const method = entry.source.replace(
      /^((?:async\s+)?)function\s+fetch/,
      '$1fetch'
    );
    const indentedMethod = method
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return `${code.slice(0, entry.start)}export default {
${indentedMethod},
} satisfies TianjiWorker;${code.slice(entry.end)}`;
  }

  const initializer = code.slice(
    entry.initializerStart,
    entry.initializerEnd
  );
  return `${code.slice(0, entry.start)}export default {
  fetch: ${initializer},
} satisfies TianjiWorker;${code.slice(entry.end)}`;
}
