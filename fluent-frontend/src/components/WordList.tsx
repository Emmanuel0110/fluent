import { useContext, useMemo, useRef } from "react";
import { Context, Word } from "../types";
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";
import { ConfigContext } from "../contexts/ConfigContext";
import { useLanguage } from "../contexts/LanguageContext";
import { FlagIcon } from "../utils/FlagIcon";
import { useVirtualizer } from "@tanstack/react-virtual";

type ListItem =
  | { type: "header"; direction: "source" | "target" }
  | { type: "word"; word: Word };

export default function WordList() {
  const { filteredWords } = useContext(ConfigContext) as Context;
  const { sourceLanguage, targetLanguage, getLanguageLabel } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const sourceLabel = getLanguageLabel(sourceLanguage);
  const targetLabel = getLanguageLabel(targetLanguage);

  const sourceWords = useMemo(
    () => filteredWords.filter((w) => w.language === sourceLanguage),
    [filteredWords, sourceLanguage],
  );
  const targetWords = useMemo(
    () => filteredWords.filter((w) => w.language === targetLanguage),
    [filteredWords, targetLanguage],
  );

  const items = useMemo<ListItem[]>(() => {
    const result: ListItem[] = [];
    if (sourceWords.length > 0) {
      result.push({ type: "header", direction: "source" });
      sourceWords.forEach((word) => result.push({ type: "word", word }));
    }
    if (targetWords.length > 0) {
      result.push({ type: "header", direction: "target" });
      targetWords.forEach((word) => result.push({ type: "word", word }));
    }
    return result;
  }, [sourceWords, targetWords]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => (items[index].type === "header" ? 36 : 40),
    getItemKey: (index) => {
      const item = items[index];
      return item.type === "header" ? `header-${item.direction}` : item.word._id;
    },
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <FilterBar />
      <div ref={containerRef} style={{ flex: 1, overflow: "auto", padding: "10px" }}>
        <div
          id="wordList"
          style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item.type === "header" ? (
                  <div className="word-list-section-header">
                    {item.direction === "source" ? (
                      <>
                        <FlagIcon languageLabel={sourceLabel} />
                        <span className="word-list-section-arrow">→</span>
                        <FlagIcon languageLabel={targetLabel} />
                      </>
                    ) : (
                      <>
                        <FlagIcon languageLabel={targetLabel} />
                        <span className="word-list-section-arrow">→</span>
                        <FlagIcon languageLabel={sourceLabel} />
                      </>
                    )}
                  </div>
                ) : (
                  <WordLine word={item.word} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
