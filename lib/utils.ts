import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs";
import dayjsUTC from "dayjs/plugin/utc";
import dayjsTimezone from "dayjs/plugin/timezone";
import { JSONSchema7 } from "json-schema";
import { sha512crypt } from 'sha512crypt-node';
 
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

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @reference http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 * @reference https://stackoverflow.com/a/8831937
 * @reference https://chat.openai.com/share/e5c82401-fd23-4546-ab8e-464a8d956ffc
 */
export function hashCode(str: string) {
  let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
      // Use codePointAt to properly handle characters outside the BMP
      let chr = str.codePointAt(i);
      if (chr !== undefined) {
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer

        // When a surrogate pair is encountered, skip the next code unit
        if (chr > 0xffff) i++;
      }
    }

  // Convert to unsigned integer
  // https://stackoverflow.com/a/47612303
  return hash >>> 0;
}


// Derived from https://stackoverflow.com/a/18750001
export function htmlEncode(str: string) {
    return str.replace(/[\u00A0-\u9999<>\&]/g, (i) => "&#" + i.charCodeAt(0) + ";");
}

// Returns all strings from a JSON object
// Derived from: https://chat.openai.com/share/41d568ff-b124-4144-a19e-b51938adf7ce
export function getAllStringsFromDict(data: any): string[] {
  function extractStrings(element: any, result: string[]): void {
    if (typeof element === "string") {
      result.push(element);
    } else if (Array.isArray(element)) {
      element.forEach((item) => extractStrings(item, result));
    } else if (typeof element === "object" && element !== null) {
      Object.values(element).forEach((value) => extractStrings(value, result));
    }
  }

  const strings: string[] = [];
  extractStrings(data, strings);
  return strings;
}

// takes in a search criteria, outputs all object paths that meet that criteria.
// Derived from https://stackoverflow.com/a/54190347/4527337
export function getObjectPaths({ properties, allOf = [], anyOf = [], oneOf = [], then, else: _else, items }: JSONSchema7, selectProperty: (a: JSONSchema7) => boolean): string[][] {
    let results = [];

    // indexed properties
    for (const propertyName in properties) {
        const property = properties[propertyName];
        if (typeof property !== 'object' || property === null) {
            // not something that we can query into
            continue;
        }

        if (selectProperty(property)) {
            results.push([propertyName]);
        }

        results.push(...getObjectPaths(property, selectProperty).map(r => [propertyName, ...r]));
    }

    // non-indexed properties
    for (const property of [...allOf, ...anyOf, ...oneOf, then, _else].filter(x => x)) {
        if (typeof property !== 'object' || property === null) {
            // not something that we can query into
            continue;
        }

        results.push(...getObjectPaths(property, selectProperty));
    }

    // array items
    if (items && typeof items === 'object' && items !== null) {
        results.push(...getObjectPaths(items as JSONSchema7, selectProperty).map(r => ['[]', ...r]));
    }

    return results;
}

export function encryptUnixPassword(password: string): string {
  const genRanHex = (size: number) => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return sha512crypt(password, genRanHex(16));
}

export function isCryptFormat(s: string) {
  // Regular expression for crypt format
  var pattern = new RegExp(
    "^\\$([1-6a-z])\\$([a-zA-Z0-9./]+)\\$([a-zA-Z0-9./]+)$"
  );
  var match = pattern.test(s);
  return match;
}

export function flatMap<T, U>(arr: T[], f: (t: T, index: number) => U[]): U[] {
  return arr.reduce<U[]>((acc, val, index) => acc.concat(f(val, index)), []);
}

export function getValuesFromPath(
  obj: Object,
  path: string[],
  currentPath: string[] = []
): { value: any, path: string[] }[] {
  if (path.length === 0) {
    return [{ value: obj, path: currentPath }];
  }

  if (obj === undefined || obj === null) {
    return [];
  }

  if (path[0] === "[]") {
    return flatMap(obj as any, (o, index) =>
      getValuesFromPath(o as Object, path.slice(1), [...currentPath, `${index}`])
    );
  }

  return getValuesFromPath((obj as Record<string, any>)[path[0]], path.slice(1), [
    ...currentPath,
    path[0],
  ]);
}

export function deepGet(obj: Record<string, any>, path: string[]): any {
  return path.reduce((acc, key) => acc?.[key], obj);
}

export function deepSet(
  obj: Record<string, any>,
  path: string[],
  value: any
): void {
  // Start from the root object and iterate through the path, except for the last key.
  path.reduce((acc, key, index) => {
    // If we're at the last key, set the value.
    if (index === path.length - 1) {
      acc[key] = value;
      return;
    }
    // If the next key doesn't exist or isn't an object, create it as an object.
    if (
      acc[key] === undefined ||
      typeof acc[key] !== "object" ||
      acc[key] === null
    ) {
      acc[key] = {};
    }
    // Move to the next level in the path.
    return acc[key];
  }, obj);
}