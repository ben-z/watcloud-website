import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs";
import dayjsUTC from "dayjs/plugin/utc";
import dayjsTimezone from "dayjs/plugin/timezone";
 
dayjs.extend(dayjsUTC);
dayjs.extend(dayjsTimezone);
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a number of bytes to a human-readable string representation.
 * @param bytes The number of bytes to convert.
 * @param decimals The number of decimal places to include in the result. Defaults to 2.
 * @returns A string representation of the number of bytes in a human-readable format.
 */
export function bytesToSize(bytes: number, decimals = 2): string {
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return 'n/a';
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / (1024 ** i)).toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Returns the plural form of a word based on the given count.
 * @param count The count of items.
 * @param word The singular form of the word.
 * @returns The plural form of the word.
 */
export function pluralize(count: number, word: string): string {
  if (count === 1) {
    return word;
  }

  // Handle specific irregular nouns
  const irregular: Record<string, string> = {
    'man': 'men',
    'woman': 'women',
    'child': 'children',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese',
    'person': 'people',
    'cactus': 'cacti',
    'nucleus': 'nuclei',
    'focus': 'foci'
    // ... add more as needed
  };

  if (irregular[word]) {
    return irregular[word];
  }

  // Words ending in 'y'
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }

  // Words ending in 'o'
  const oExceptions = ['piano', 'photo', 'halo'];  // ... add more exceptions as needed
  if (word.endsWith('o') && !oExceptions.includes(word)) {
    return `${word}es`;
  }

  // Words ending in 's', 'x', 'z', 'ch', 'sh'
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) {
    return `${word}es`;
  }

  // Default
  return `${word}s`;
}


/**
 * Returns a string with the count and pluralized word.
 * @param count The count of the word.
 * @param word The word to be pluralized.
 * @returns A string with the count and pluralized word.
 * @example
 * pluralizeWithCount(1, 'apple') // '1 apple'
 * pluralizeWithCount(0, 'apple') // '0 apples'
 * pluralizeWithCount(2, 'apple') // '2 apples'
 * pluralizeWithCount(1, 'box') // '1 box'
 * pluralizeWithCount(2, 'box') // '2 boxes'
 */
export function pluralizeWithCount(count: number, word: string) {
  return `${count} ${pluralize(count, word)}`;
}

// Derived from: https://swr.vercel.app/docs/getting-started
export async function fetcher(...args: Parameters<typeof fetch>) {
  return (await fetch(...args)).json()
}

export function stripPrefix(str: string, prefix: string) {
  if (str.startsWith(prefix)) {
    return str.slice(prefix.length)
  }
  return str
}

// Helper type to extract the type of array elements
// Derived from https://chat.openai.com/share/c3cb3d1d-49e9-4abe-ac71-d006e5dd7ecb
export type ElementType<T> = T extends (infer U)[] ? U : never;

// Mapped type to iterate through all properties of T and extract the array element types
// Derived from https://chat.openai.com/share/c3cb3d1d-49e9-4abe-ac71-d006e5dd7ecb
export type UnionOfElementTypes<T> = {
    [K in keyof T]: ElementType<T[K]>;
}[keyof T];

// Healthchecks.io Check type from https://healthchecks.io/docs/apiv2/
export type HealthchecksioCheckStatus = "new" | "up" | "grace" | "down" | "paused";
export type HealthchecksioCheck = {
    name: string;
    slug: string;
    tags: string;
    desc: string;
    grace: number;
    n_pings: number;
    status: HealthchecksioCheckStatus;
    started: boolean;
    last_ping: string;
}
export type HealthchecksioCheckProcessed = Omit<HealthchecksioCheck, "tags"> & { tags: string[] };

/**
 * Creates a debounced function that delays invoking `func` until after `waitForMs` milliseconds have elapsed
 * since the last time the debounced function was invoked.
 *
 * @template T
 * @param {T} func - The function to debounce.
 * @param {number} waitForMs - The number of milliseconds to delay.
 * @returns {(...args: Parameters<T>) => Promise<ReturnType<T>>} - A new function that debounces the invocation of `func`.
 *
 * @example
 * const debouncedFunc = debounce(someFunction, 200);
 * debouncedFunc(arg1, arg2).then(result => console.log(result));
 */
export function debounce<T extends (...args: any[]) => any>(func: T, waitForMs: number): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        timeout = undefined;
        resolve(func(...args));
      }, waitForMs);
    });
  };
}

export function dayjsTz(date: string, timezone: string) {
  return dayjs.tz(date, timezone)
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
}