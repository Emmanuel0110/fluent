import { Word, SearchFilter } from "../types";

export const someFilter = (searchFilter: SearchFilter, treeFilter: string[]): boolean =>
  searchFilter.filter(({ isActive }) => isActive).length !== 0 || treeFilter.length !== 0;

const wordHasTagOrIncludeString = (word: Word, filterString: string): boolean => {
  if (filterString.toLowerCase().startsWith("not ")) {
    if (filterString.toLowerCase().slice(4).trim().startsWith("#")) {
      return !word.tags.includes(filterString.toLowerCase().trim().slice(5));
    } else {
      return !word.text
        .toLowerCase()
        .includes(filterString.toLowerCase().trim().slice(4).replace(/^\"/, "").replace(/\"$/, ""));
    }
  } else {
    if (filterString.toLowerCase().trim().startsWith("#")) {
      return word.tags.includes(filterString.toLowerCase().trim().slice(1));
    } else {
      return word.text.toLowerCase().includes(filterString.toLowerCase().replace(/^\"/, "").replace(/\"$/, ""));
    }
  }
};

const isFilteredBySearchFilter = (word: Word, searchFilter: SearchFilter): boolean => {
  return searchFilter
    .filter(({ isActive }) => isActive)
    .every(({ data }) => data.some((filterString) => wordHasTagOrIncludeString(word, filterString)));
};

export const isFiltered = (word: Word, searchFilter: SearchFilter, treeFilter: string[]): boolean =>
  isFilteredBySearchFilter(word, searchFilter) && (treeFilter.length === 0 || treeFilter.includes(word._id));
