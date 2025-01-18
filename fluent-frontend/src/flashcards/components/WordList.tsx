import { Fragment } from "react";
import { Word } from "../../types";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent"; // TODO
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";

export default function WordList({ filteredWords }: { filteredWords: Word[] }) {
  return (
    <div style={{height: "100%", overflow: "auto"}}>
      <FilterBar />
      <div id="flashcardList">
        {filteredWords.map((word, index) => (
          <WordLine key={index} word={word} />
        ))}
      </div>
    </div>
  );
}
