import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { Button } from "react-bootstrap";
import { ConfigContext } from "../../contexts/ConfigContext";
import { Context } from "../../types";
import { useNavigate } from "react-router-dom";

interface LeftMenuBarProps {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function LeftMenuBar({ isOpen, setOpen }: LeftMenuBarProps) {
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
          <div>
            <Button id="newConversationButton" onClick={openNewDraft}>
              New conversation
            </Button>
          </div>
          <div id="statusSection">
            <div
              onClick={() => {
                setStatus("dashboard");
                navigate("/dashboard");
                setOpen(false);
              }}
            >
              <div className={status === "dashboard" ? "selected" : "unselected"}></div>
              <div>Dashboard</div>
            </div>
            <div
              onClick={() => {
                setStatus("words");
                navigate("/words");
                setOpen(false);
              }}
            >
              <div className={status === "words" ? "selected" : "unselected"}></div>
              <div>Words</div>
            </div>
            <div
              onClick={() => {
                setStatus("conversations");
                navigate("/conversations");
                setOpen(false);
              }}
            >
              <div className={status === "conversations" ? "selected" : "unselected"}></div>
              <div>Conversations</div>
            </div>
          </div>
        </div>
        <div>
          <Button id="startAReviewButton" variant="outline-primary" onClick={startReview}>
            Start a review
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LeftMenuBar;
