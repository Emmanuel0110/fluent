import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchGroup, leaveGroup } from "../../APICalls";
import { GroupDetail as GroupDetailData } from "../../types";
import { FlagIcon } from "../../utils/FlagIcon";
import { RankBadge } from "../RankBadge";
import { ConfirmDialog } from "../ConfirmDialog";
import "./groups.css";

function GroupDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!groupId) return;
      const data = await fetchGroup(groupId);
      setGroup(data);
      setLoading(false);
    };
    load();
  }, [groupId]);

  const copyCode = async () => {
    if (!group) return;
    await navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
  };

  const leave = async () => {
    if (!groupId) return;
    await leaveGroup(groupId);
    navigate("/groups");
  };

  if (loading) return <p className="groups-empty">{t("group.loading")}</p>;
  if (!group) return <p className="groups-empty">{t("group.not_found")}</p>;

  return (
    <div className="groups-container">
      <div className="group-detail-header">
        <div className="group-detail-title">
          <FlagIcon languageLabel={group.targetLanguage} className="group-row-flag" />
          <h1>{group.name}</h1>
        </div>
        <div className="group-detail-controls">
          <div className="group-code-display">
            <span className="group-code-label">{t("group.code")}:</span>
            <span className="group-code">{group.inviteCode}</span>
            <button className="btn btn-secondary btn-sm" onClick={copyCode}>
              {copied ? t("group.copied") : t("group.copy")}
            </button>
          </div>
          <button className="btn delete-btn btn-sm" onClick={() => setConfirmLeave(true)}>
            {t("group.leave")}
          </button>
        </div>
      </div>

      <ul className="member-list">
        {group.members.map((member, index) => (
          <li
            key={member.userCourseId}
            className="member-row"
            onClick={() => navigate(`/groups/${group._id}/members/${member.userCourseId}`)}
          >
            <span className="member-rank-position">{index + 1}</span>
            <span className="member-rank-badge">
              <RankBadge rank={member.rank} />
            </span>
            <span className="member-name">{member.username}</span>
            <span className="member-points">
              {member.score} {t("group.points")}
            </span>
          </li>
        ))}
      </ul>

      {confirmLeave && (
        <ConfirmDialog
          message={t("group.leave_confirm")}
          confirmLabel={t("group.leave")}
          onConfirm={leave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </div>
  );
}

export default GroupDetail;
