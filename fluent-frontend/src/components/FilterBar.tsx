import React, { useContext } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";

export default function FilterBar() {
  const { tagFilter } = useContext(ConfigContext) as Context;
  return <div>{tagFilter && <span className="filterItem">{"#" + tagFilter.label}</span>}</div>;
}
