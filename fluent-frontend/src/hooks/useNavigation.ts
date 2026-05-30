import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavigationService } from "../services/navigationService";
import { View, WordTag } from "../types";

export const useNavigation = (
  openedWords: any[],
  openedConversations: any[],
  searchFilter: string,
  tagFilter: WordTag | null,
  setOpenedWords: (words: any[]) => void,
  setOpenedConversations: (conversations: any[]) => void,
  setSearchFilter: (filter: string) => void
) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationService = useRef(new NavigationService());

  useEffect(() => {
    const view: View = {
      openedWords,
      openedConversations,
      searchFilter,
      tagFilter,
      location: location.pathname,
    };
    navigationService.current.addToHistory(view);
  }, [location, searchFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (e.altKey) {
            e.preventDefault();
            const backView = navigationService.current.goBack();
            if (backView) {
              refreshView(backView);
            }
          }
          break;
        case "ArrowRight":
          if (e.altKey) {
            e.preventDefault();
            const forwardView = navigationService.current.goForward();
            if (forwardView) {
              refreshView(forwardView);
            }
          }
          break;
        default:
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const refreshView = (view: View) => {
    setOpenedWords(view.openedWords);
    setOpenedConversations(view.openedConversations);
    setSearchFilter(view.searchFilter);
    navigate(view.location);
  };
};
