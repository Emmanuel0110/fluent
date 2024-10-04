import { Dispatch, RefObject, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ConfigContext, someFilter } from "../App";
import { Context } from "../types";
import { logout } from "../auth/authActions";
import AutoComplete from "../utils/Autocomplete";

const parseLabel = (label: string) => {
  let result: string[] = [];
  //For instance "bla bla" not #blo not "blo blo" => [not "blo blo", not #blo, bla bla]
  const regex1 = /not\s\".*?\"/gi; //finds not "blo blo"
  const matches1 = label.match(regex1);
  matches1?.forEach((match) => {
    result.push(match);
    label = label.replace(match, "");
  });

  const regex2 = /\".*?\"/gi; //finds "bla bla"
  const matches2 = label.match(regex2);
  matches2?.forEach((match) => {
    result.push(match);
    label = label.replace(match, "");
  });

  const regex3 = /not\s\S+/gi; //finds not #blo
  const matches3 = label.match(regex3);
  matches3?.forEach((match) => {
    result.push(match);
    label = label.replace(match, "");
  });

  label.split(" ").forEach((el) => {
    if (el) result.push(el);
  });

  return result;
};

const insertTag = (tagLabel: string, inputRef: RefObject<HTMLInputElement>) => {
  if (inputRef.current?.selectionStart) {
    const currentBloc = inputRef.current.value.slice(0, inputRef.current.selectionStart).split(" ").length - 1;
    let arr = inputRef.current.value.split(" ");
    arr.splice(currentBloc, 1, "#" + tagLabel);
    return arr.join(" ");
  }
  return "";
};

function Navbar() {
  const { user, searchFilter, setSearchFilter, setIsAuthenticated, tags, treeFilter, setTreeFilter, searchInput } =
    useContext(ConfigContext) as Context;

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "k":
        if (e.ctrlKey) {
          e.preventDefault();
          inputRef.current?.focus();
        }
        break;
      default:
    }
  };

  const cancelFilter = () => {
    setSearchFilter([]);
    setTreeFilter([]);
  };

  const search = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      const tag = tags.find((tag) => tag._id === _id)!;
      setLocalDescription(insertTag(tag.label, inputRef));
    } else if (label) {
      setSearchFilter([...searchFilter, { isActive: true, data: parseLabel(label) }]);
      setLocalDescription("");
    }
  };

  return (
    <div id="navbar" className="navb">
      <div id="githubIconArea">
        <a href="https://github.com/Emmanuel0110/flashcard-manager">
          <div className="githubIcon"></div>
        </a>
      </div>
      <div id="searchArea">
        <div id="searchAreaContainer">
          <div id="searchAreaInput">
            <AutoComplete
              ref={inputRef}
              dropdownList={tags.map((tag) => ({ ...tag, label: "#" + tag.label }))}
              callback={search}
              placeholder="Search..."
              placement="bottom-start"
              searchInput={searchInput}
            />
          </div>
          {someFilter(searchFilter, treeFilter) && <div id="cancelFilterForSearch" onClick={cancelFilter}></div>}
        </div>
      </div>
      <div id="nameLabel">{user?.username}</div>
      <Link to="/profile">
        <div id="avatar-icon"></div>
      </Link>

      <div className="navButton" onClick={() => logout(setIsAuthenticated)}>
        Logout
      </div>
    </div>
  );
}

export default Navbar;
