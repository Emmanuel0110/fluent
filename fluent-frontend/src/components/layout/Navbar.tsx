import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../contexts/ConfigContext";
import { Context } from "../../types";
import { logout } from "../../auth/authActions";
import LanguageSelector from "../languageSelector/LanguageSelector";
import ProfileOptions from "../profileOptions/ProfileOptions";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface NavbarProps {
  onMenuToggle: () => void;
  onMenuClose: () => void;
}

function Navbar({ onMenuToggle, onMenuClose }: NavbarProps) {
  const { t } = useTranslation();
  const { setIsAuthenticated } = useAuth();
  const { searchFilter, setSearchFilter, tagFilter, setTagFilter } = useContext(ConfigContext) as Context;
  const navigate = useNavigate();
  const location = useLocation();

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLInputElement).nodeName.toLowerCase() !== "input") {
      switch (e.key) {
        case "Tab":
          e.preventDefault();
          inputRef.current?.focus();
          break;
        default:
      }
    } else {
      switch (e.key) {
        case "Escape":
          (e.target as HTMLInputElement).blur();
          break;
        default:
      }
    }
  };

  const cancelFilter = () => {
    setSearchFilter("");
    setTagFilter(null);
  };

  return (
    <div id="navbar" className="navb">
      <div id="burgerMenuButton" onClick={onMenuToggle} />
      <div id="searchArea">
        <div id="searchAreaContainer">
          <div id="searchAreaInput">
            <input
              type="text"
              value={searchFilter}
              onFocus={onMenuClose}
              onChange={(e) => {
                if (location.pathname !== "/words") navigate("/words");
                setSearchFilter(e.target.value);
              }}
            />
          </div>
          {(searchFilter || tagFilter) && <div id="cancelFilterForSearch" onClick={cancelFilter}></div>}
        </div>
      </div>
      <LanguageSelector />
      <ProfileOptions />
      <div id="logoutButton" className="navButton" title={t("nav.logout")} onClick={() => logout(setIsAuthenticated)} />
    </div>
  );
}

export default Navbar;
