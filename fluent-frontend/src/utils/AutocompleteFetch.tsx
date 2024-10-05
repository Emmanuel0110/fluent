import React, {
  ChangeEvent,
  Dispatch,
  ForwardedRef,
  MutableRefObject,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Overlay } from "react-bootstrap";
import { Placement } from "react-bootstrap/esm/types";
import { throttle } from 'lodash';

type DropDownList = { _id: string; label: string }[];
type FetchCallback = (searchString: string) => Promise<DropDownList>;

interface AutoCompleteFetchProps {
  fetchCallback: FetchCallback;
  callback: ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => void;
  placeholder: string;
  placement: string;
  onPaste?: any;
  onClick?: any;
  searchInput?: string;
}

const useForwardRef = <T,>(ref: ForwardedRef<T>, initialValue: any = null) => {
  const targetRef = useRef<T>(initialValue);

  useEffect(() => {
    if (!ref) return;

    if (typeof ref === "function") {
      ref(targetRef.current);
    } else {
      ref.current = targetRef.current;
    }
  }, [ref]);

  return targetRef;
};

const DropdownItem = ({
  _id,
  label,
  index,
  selectedIndex,
  callback,
  setLocalDescription,
}: {
  _id: string;
  label: string;
  index: number;
  selectedIndex: number | null;
  callback: any;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
}) => {
  const dropdownItemRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const { current } = dropdownItemRef;
    if (current !== null && selectedIndex === index) {
      current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <li
      ref={dropdownItemRef}
      key={index}
      className={"dropdownItem" + (selectedIndex === index ? " selected" : "")}
      onClick={(e: React.MouseEvent) => callback({ _id, label, setLocalDescription })}
    >
      {label}
    </li>
  );
};

const updateDropdownListWithNewList = (dropdownList: DropDownList, newList: DropDownList) => {
  return newList.reduce((acc, value) => {
    return acc.find(({ _id }) => _id === value._id) ? [value] : [...acc, value];
  }, dropdownList);
};

const AutoCompleteFetch = forwardRef<HTMLInputElement, AutoCompleteFetchProps>(
  ({ fetchCallback, callback, placeholder, placement, onPaste, searchInput }, ref) => {
    const [editingMode, setEditingMode] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [localDescription, setLocalDescription] = useState("");
    const [currentSearch, setCurrentSearch] = useState("");
    const forwardedRef = useForwardRef<HTMLInputElement>(ref);
    const [dropdownList, setDropdownList] = useState<DropDownList>([]);

    const throttleFetchCallback = useMemo(() =>
      throttle(fetchCallback, 500, { leading: true, trailing: true }),
    []);
    
    useEffect(() => {
      if (currentSearch !== "") {
        throttleFetchCallback(currentSearch).then((newList) =>
          setDropdownList((dropdownList) => updateDropdownListWithNewList(dropdownList, newList))
        );
      }

      setEditingMode(currentSearch !== "");
    }, [currentSearch]);

    useEffect(() => {
      if (searchInput !== undefined) setLocalDescription(searchInput);
    }, [searchInput]);

    //Click outside feature ------------------
    const dropdownMenuRef: any = useRef();
    useEffect(() => {
      if (editingMode) document.addEventListener("click", globalClickListener);
      return () => document.removeEventListener("click", globalClickListener);
    }, [editingMode]);

    const globalClickListener = (nativeEvent: MouseEvent) => {
      if (nativeEvent.ctrlKey || (dropdownMenuRef && dropdownMenuRef.current.contains(nativeEvent.target))) return;
      closeOverlay();
    }; //-------------------------------------

    const closeOverlay = () => {
      setEditingMode(false);
      setSelectedIndex(null);
    };

    const filteredDropdownList =
      dropdownList?.length && currentSearch !== ""
        ? dropdownList.filter((el) => el.label.toUpperCase().includes(currentSearch.toUpperCase()))
        : [];

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        closeOverlay();
      } else if (e.key === "Enter") {
        if (selectedIndex !== null && filteredDropdownList[selectedIndex] !== undefined) {
          callback({ _id: filteredDropdownList[selectedIndex]._id, label: localDescription, setLocalDescription });
        }
        closeOverlay();
      } else if (e.key === "ArrowUp") {
        setSelectedIndex((selectedIndex) => {
          if (typeof selectedIndex === "number") {
            return selectedIndex === 0 ? filteredDropdownList.length - 1 : selectedIndex - 1;
          }
          return filteredDropdownList.length - 1;
        });
      } else if (e.key === "ArrowDown") {
        setSelectedIndex((selectedIndex) => {
          if (typeof selectedIndex === "number") {
            return selectedIndex === filteredDropdownList.length - 1 ? 0 : selectedIndex + 1;
          }
          return 0;
        });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.stopPropagation();
      }
    };

    return (
      <div ref={dropdownMenuRef}>
        <input
          ref={forwardedRef}
          type="text"
          placeholder={placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalDescription(e.target.value);
            setCurrentSearch(e.target.value);
          }}
          onKeyDown={onKeyDown}
          value={localDescription}
          onPaste={onPaste}
        />
        {editingMode && filteredDropdownList.length ? (
          <Overlay target={forwardedRef.current} show={true} placement={placement as Placement}>
            <ul className="dropdownList" style={{ width: forwardedRef.current.offsetWidth, zIndex: 10 }}>
              {filteredDropdownList.map(({ _id, label }, index) => (
                <DropdownItem
                  key={index}
                  _id={_id}
                  label={label}
                  index={index}
                  selectedIndex={selectedIndex}
                  callback={callback}
                  setLocalDescription={setLocalDescription}
                />
              ))}
            </ul>
          </Overlay>
        ) : null}
      </div>
    );
  }
);

export default AutoCompleteFetch;
