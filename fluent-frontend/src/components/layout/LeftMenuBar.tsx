import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { Button } from "react-bootstrap";
import { ConfigContext } from "../../contexts/ConfigContext";
import { Context } from "../../types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Feedback from "../feedback/Feedback";
import { useTranslation } from "react-i18next";

interface LeftMenuBarProps {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function LeftMenuBar({ isOpen, setOpen }: LeftMenuBarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, setStatus } = useContext(ConfigContext) as Context;

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    setStatus("review");
    navigate("/review");
    setOpen(false);
  };

  const openNewDraft = () => {
    setStatus("new");
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
                setStatus("dashboard");
                navigate("/dashboard");
                setOpen(false);
              }}
            >
              <div className={status === "dashboard" ? "selected" : "unselected"}></div>
              <div>{t("nav.dashboard")}</div>
            </div>
            <div
              onClick={() => {
                setStatus("suggestions");
                navigate("/suggestions");
                setOpen(false);
              }}
            >
              <div className={status === "suggestions" ? "selected" : "unselected"}></div>
              <div>{t("nav.suggestions")}</div>
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
