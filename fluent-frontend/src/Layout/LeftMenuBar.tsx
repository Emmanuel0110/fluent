import { useContext, useEffect } from "react";
import { Button } from "react-bootstrap";
import { ConfigContext } from "../App";
import { Context } from "../types";
import { useNavigate } from "react-router-dom";

function LeftMenuBar() {
  const navigate = useNavigate();
  const { status, setStatus, saveAsNewFlashcard } = useContext(ConfigContext) as Context;

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
    setStatus("To be reviewed");
  };

  const openNewDraft = () => {
    navigate("/new");
  };

  return (
    <div id="leftSideMenu">
      <div id="leftSideMenuItems">
        <div>
          <Button style={{ margin: "0px 10px 6px" }} onClick={openNewDraft}>
            New conversation
          </Button>
        </div>
        <div id="statusSection">
          <div onClick={() => navigate("/words")}>
            <div className={status === "Published" ? "selected" : "unselected"}></div>
            <div>Words</div>
          </div>
          <div onClick={() => navigate("/conversations")}>
            <div className={status === "Draft" ? "selected" : "unselected"}></div>
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
  );
}

export default LeftMenuBar;
