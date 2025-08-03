import { useContext } from "react";
import { Context, Word } from "../types";
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";
import { ConfigContext } from "../contexts/ConfigContext";

export default function WordList() {
  const { filteredWords } = useContext(ConfigContext) as Context;
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <FilterBar />
      <div id="wordList">
        {filteredWords.map((word, index) => (
          <WordLine key={index} word={word} />
        ))}
      </div>
    </div>
  );
}
