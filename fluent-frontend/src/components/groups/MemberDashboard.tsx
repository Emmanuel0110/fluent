import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMemberDashboard } from "../../APICalls";
import Dashboard from "../Dashboard";
import "./groups.css";

// Renders another group member's dashboard for the group's target language. The
// Dashboard component is reused as-is; only the data source and header differ.
function MemberDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId, userCourseId } = useParams();

  const fetcher = useCallback(
    () => getMemberDashboard(groupId ?? "", userCourseId ?? ""),
    [groupId, userCourseId],
  );

  return (
    <div className="member-dashboard-wrapper">
      <button className="btn btn-link group-back-link" onClick={() => navigate(`/groups/${groupId}`)}>
        ← {t("group.back_to_group")}
      </button>
      <Dashboard fetcher={fetcher} showTutorial={false} />
    </div>
  );
}

export default MemberDashboard;
