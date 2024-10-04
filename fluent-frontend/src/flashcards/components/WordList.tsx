import { Fragment, useContext } from "react";
import { Flashcard, Word } from "../../types";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent";
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";

export default function WordList({ filteredWords }: { filteredWords: Word[] }) {
  return (
    <Fragment>
      <FilterBar />
      <div id="flashcardList">
        {filteredWords.map((word, index) => (
          <WordLine key={index} word={word} />
        ))}
      </div>
    </Fragment>
  );
}
