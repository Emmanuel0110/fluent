import { Word } from "../types";
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";

export default function WordList({ filteredWords }: { filteredWords: Word[] }) {
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
