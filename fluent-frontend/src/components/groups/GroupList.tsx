import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchMyGroups } from "../../APICalls";
import { GroupSummary } from "../../types";
import { FlagIcon } from "../../utils/FlagIcon";
import { CreateGroupModal } from "./CreateGroupModal";
import { JoinGroupModal } from "./JoinGroupModal";
import "./groups.css";

function GroupList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const load = async () => {
    const data = await fetchMyGroups();
    setGroups(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>{t("group.title")}</h1>
        <div className="groups-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
            {t("group.join")}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            {t("group.create")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="groups-empty">{t("group.loading")}</p>
      ) : groups.length === 0 ? (
        <p className="groups-empty">{t("group.empty")}</p>
      ) : (
        <ul className="groups-list">
          {groups.map((group) => (
            <li key={group._id} className="group-row" onClick={() => navigate(`/groups/${group._id}`)}>
              <FlagIcon languageLabel={group.targetLanguage} className="group-row-flag" />
              <span className="group-row-name">{group.name}</span>
              <span className="group-row-count">{t("group.members", { count: group.memberCount })}</span>
            </li>
          ))}
        </ul>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {showJoin && (
        <JoinGroupModal
          onClose={() => setShowJoin(false)}
          onJoined={(groupId) => {
            setShowJoin(false);
            navigate(`/groups/${groupId}`);
          }}
        />
      )}
    </div>
  );
}

export default GroupList;
