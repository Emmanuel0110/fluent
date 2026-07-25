import { Dispatch, SetStateAction, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Feedback from "../feedback/Feedback";
import { useTranslation } from "react-i18next";
import { useSwipeAndKeyboard } from "../../hooks/useSwipeAndKeyboard";

interface LeftMenuBarProps {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function LeftMenuBar({ isOpen, setOpen }: LeftMenuBarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useSwipeAndKeyboard({
    callback: () => setOpen(false),
    direction: "left",
    key: "",
    dependencies: [isOpen],
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "m":
        if (e.ctrlKey) {
          e.preventDefault();
          openNewDraft();
        }
        break;
    }
  };

  const startReview = () => {
    navigate("/review");
    setOpen(false);
  };

  const openNewDraft = () => {
    navigate("/new");
    setOpen(false);
  };

  return (
    <div id="leftSideMenuContainer">
      <div id="leftSideMenu" className={isOpen ? "open" : "closed"}>
        <div>
          {user?.isAdmin && (
            <Button id="newConversationButton" onClick={openNewDraft}>
              {t("nav.new_conversation")}
            </Button>
          )}
          <div id="statusSection">
            <div
              onClick={() => {
                navigate("/dashboard");
                setOpen(false);
              }}
            >
              <div className={location.pathname === "/dashboard" ? "selected" : "unselected"}></div>
              <div>{t("nav.dashboard")}</div>
            </div>
            <div
              onClick={() => {
                navigate("/suggestions");
                setOpen(false);
              }}
            >
              <div className={location.pathname === "/suggestions" ? "selected" : "unselected"}></div>
              <div>{t("nav.suggestions")}</div>
            </div>
            <div
              onClick={() => {
                navigate("/groups");
                setOpen(false);
              }}
            >
              <div className={location.pathname.startsWith("/groups") ? "selected" : "unselected"}></div>
              <div>{t("nav.groups")}</div>
            </div>
          </div>
        </div>
        <div>
          <div>
            <Button id="startAReviewButton" variant="outline-primary" onClick={startReview}>
              {t("nav.start_review")}
            </Button>
          </div>
          <Feedback />
        </div>
      </div>
    </div>
  );
}

export default LeftMenuBar;
