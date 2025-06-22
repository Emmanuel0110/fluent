import React, { useContext } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";

export default function FilterBar() {
  const { searchFilter, setSearchFilter, setSearchInput } = useContext(ConfigContext) as Context;

  const toggleActive = (index: number) =>
    setSearchFilter((searchFilter) =>
      searchFilter.map((el, elIndex) => (elIndex === index ? { ...el, isActive: !el.isActive } : el))
    );

  const edit = (index: number) => {
    setSearchInput(searchFilter[index].data.join(" "));
    close(index);
  };

  const close = (index: number) => setSearchFilter(searchFilter.filter((el, elIndex) => elIndex !== index));

  return (
    <ul id="filterList">
      {searchFilter.map((filterArrayOR, index) => {
        return (
          <li
            key={index}
            className={"filterItem" + (filterArrayOR.isActive ? "" : " inactive")}
            onClick={() => toggleActive(index)}
            onContextMenu={(e) => {
              e.preventDefault();
              edit(index);
            }}
          >
            {filterArrayOR.data.join(" ")}
            <div
              className="filterClose"
              onClick={(e) => {
                e.stopPropagation();
                close(index);
              }}
            ></div>
          </li>
        );
      })}
    </ul>
  );
}
