export function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export function arraysEqual(arr1, arr2) {
  arr1.sort();
  arr2.sort();
  return arr1.length === arr2.length && arr1.every((value, index) => value.equals(arr2[index]));
}

export function mergeArraysWithoutDuplicates(arr1, arr2) {
  return [...arr1, ...arr2.filter((el) => !arr1.some((val) => val.equals(el)))];
}

/**
 * Validates and parses a date string for filtering
 * @param {string} dateString - The date string to validate
 * @returns {Date|null} Parsed date object or null if invalid
 */
export function validateAndParseDate(dateString) {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    } else {
      console.warn(`Invalid date string provided: ${dateString}`);
      return null;
    }
  } catch (error) {
    console.warn(`Error parsing date string: ${dateString}`, error);
    return null;
  }
}
