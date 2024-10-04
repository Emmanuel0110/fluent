import React, { useState } from "react";

interface InfiniteScrollComponentProps {
  skip: number;
  callback: (skip: number, limit: number) => Promise<any>;
  children: React.ReactNode;
}

const InfiniteScrollComponent: React.FC<InfiniteScrollComponentProps> = ({skip, callback, children }) => {
  const LIMIT = 30;
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    var { scrollHeight, scrollTop, clientHeight } = e.target as HTMLDivElement;
    const bottom = scrollHeight - scrollTop - clientHeight < 2;
    if (bottom) {
      callback(skip, LIMIT);
    }
  };
  return (
    <div className="infiniteScrollComponent" onScroll={handleScroll}>
      {children}
    </div>
  );
};

export default InfiniteScrollComponent;
