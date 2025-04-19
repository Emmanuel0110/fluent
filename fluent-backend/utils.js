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
