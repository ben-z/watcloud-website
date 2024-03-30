// This file contains WATO-specific utility functions.
// This is a way to encapsulate WATO-specific business logic. 

// Sort hostnames such that cluster hostnames appear first
export function hostnameSorter(a: string, b: string) {
    const aIsClusterHostname = a.endsWith(".cluster.watonomous.ca")
    const bIsClusterHostname = b.endsWith(".cluster.watonomous.ca")
    return +bIsClusterHostname - +aIsClusterHostname
}

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 * @see https://stackoverflow.com/a/8831937
 */
export function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  // Convert to unsigned integer
  // https://stackoverflow.com/a/47612303
  return hash >>> 0;
}


// Derived from https://stackoverflow.com/a/18750001
export function htmlEncode(str: string) {
    return str.replace(/[\u00A0-\u9999<>\&]/g, (i) => "&#" + i.charCodeAt(0) + ";");
}