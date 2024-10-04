import { useEffect, useRef } from 'react';
import Split from 'split.js';

const useSplitPane = (containersIds: string[], direction: 'vertical' | 'horizontal', sizes: number[], isVisible: boolean = true, gutterSize: number = 5, minSize: number = 0) => {
  const instance  : any = useRef();
  useEffect(() => {
      instance.current = Split(containersIds, {
          sizes,
          direction,
          gutterSize,
          minSize,
          onDragEnd: sizes => constraintsPaneSizeRef.current = sizes
        });
  },[]);
  const constraintsPaneSizeRef = useRef(sizes);
  const show = () => instance.current.setSizes(constraintsPaneSizeRef.current);
  const hide = () => instance.current.setSizes([100, 0]);
  useEffect(() => {
      if (isVisible) {
          show();
      } else {
          hide();
      }
  },[isVisible]);
}

export default useSplitPane;