import React, { useEffect, useRef, useState } from "react";
import "./DotOptions.css";

interface DotOptionsProps {
  obj: any;
  options: { callback: (arg: any) => void; label: string }[];
}

const DotOptions: React.FC<DotOptionsProps> = ({ obj, options }) => {
  const [isVisible, setIsVisible] = useState(false);

  //Click outside feature ------------------
  const dropdownMenuRef: any = useRef();
  useEffect(() => {
    if (isVisible) document.addEventListener("click", globalClickListener);
    return () => document.removeEventListener("click", globalClickListener);
  }, [isVisible]);

  const globalClickListener = (nativeEvent: MouseEvent) => {
    if (nativeEvent.ctrlKey || (dropdownMenuRef && dropdownMenuRef.current.contains(nativeEvent.target))) return;
    setIsVisible(false);
  }; //-------------------------------------

  const onClickDots: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    setIsVisible((isVisible) => {
      return !isVisible;
    });
  };
  const onClick = (callback: (arg: object) => void) => {
    callback(obj);
    setIsVisible(false);
  };
  return (
    <div className="dotsOptions">
      <div className="dots" onClick={onClickDots}></div>
      {isVisible && (
        <div ref={dropdownMenuRef} className="dotsOptionMenu">
          {options.map(({ callback, label }, index) => (
            <div key={index} className="optionLabel" onClick={(e) => onClick(callback)}>
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DotOptions;
