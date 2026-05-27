export interface ImportedPollDraft {
  title: string;
  description: string;
  questions: Array<{
    text: string;
    options: string[];
  }>;
}

const MAX_QUESTIONS = 50;
const MAX_OPTIONS = 8;

// Обробчик CSV
export function parsePollCsv(csvText: string): ImportedPollDraft {
  const rows = parseCsv(csvText)
    .map((row: string[]) => row.map((cell: string) => cell.trim()))
    .filter((row: string[]) => row.some((cell: string) => cell.length > 0));

  if (rows.length === 0) {
    throw new Error('CSV файл порожній.');
  }

  const header = rows[0];
  const hasHeader = detectHeader(header);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const titleIndex = hasHeader ? findColumnIndex(header, ['title', 'polltitle', 'назва']) : 0;
  const descriptionIndex = hasHeader
    ? findColumnIndex(header, ['description', 'desc', 'опис'])
    : 1;
  const questionIndex = hasHeader ? findColumnIndex(header, ['question', 'питання']) : 2;

  const reservedIndexes = new Set([titleIndex, descriptionIndex, questionIndex]);
  const optionIndexes = header
    .map((_, index: number) => index)
    .filter((index: number) => !reservedIndexes.has(index));

  if (questionIndex < 0 || optionIndexes.length < 2) {
    throw new Error('CSV має містити колонки question, option1, option2 щонайменше.');
  }

  let title = '';
  let description = '';
  const questions: ImportedPollDraft['questions'] = [];

  for (const row of dataRows) {
    const questionText = getCell(row, questionIndex);
    const options = optionIndexes.map((index: number) => getCell(row, index)).filter(Boolean);

    if (!questionText && options.length === 0) {
      continue;
    }

    if (!questionText) {
      throw new Error('Кожен непорожній рядок CSV має містити текст питання.');
    }

    if (options.length < 2) {
      throw new Error(`Питання "${questionText}" має містити щонайменше 2 варіанти.`);
    }

    if (options.length > MAX_OPTIONS) {
      throw new Error(`Питання "${questionText}" перевищує ліміт у ${MAX_OPTIONS} варіантів.`);
    }

    title ||= getCell(row, titleIndex);
    description ||= getCell(row, descriptionIndex);
    questions.push({ text: questionText, options });
  }

  if (questions.length === 0) {
    throw new Error('У CSV не знайдено жодного питання.');
  }

  if (questions.length > MAX_QUESTIONS) {
    throw new Error(`CSV перевищує ліміт у ${MAX_QUESTIONS} питань.`);
  }

  return {
    title: title || 'Імпортоване опитування',
    description,
    questions,
  };
}

// Базовий парсер CSV
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  const source = text.replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);
  return rows;
}

// Перевірка наявності заголовка CSV
function detectHeader(header: string[]): boolean {
  return header.some((cell: string) =>
    ['title', 'polltitle', 'description', 'question', 'назва', 'опис', 'питання'].includes(
      normalize(cell)
    )
  );
}

// Пошук індексу колонки
function findColumnIndex(header: string[], aliases: string[]): number {
  const normalizedAliases = aliases.map(normalize);
  return header.findIndex((cell: string) => normalizedAliases.includes(normalize(cell)));
}

// Нормалізація назви колонки
function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s_-]/g, '');
}

// Отримання значення клітинки
function getCell(row: string[], index: number): string {
  if (index < 0) {
    return '';
  }

  return row[index]?.trim() ?? '';
}
