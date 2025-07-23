import { useEffect } from "react";
import { Nav } from "react-bootstrap";

function TabNav({
  tabsData,
  selectedId,
  closeTab,
  closeOtherTabs,
  closeAllTabs,
  selectTab,
}: {
  tabsData: { id: string; text: string }[];
  selectedId: string;
  closeTab: (index: number) => void;
  closeOtherTabs: (e: React.MouseEvent<HTMLElement>, index: number) => void;
  closeAllTabs: () => void;
  selectTab: (index: string | null) => void;
}) {
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tabsData, selectedId]);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "q":
        if (e.ctrlKey) {
          e.preventDefault();
          closeTab(tabsData.findIndex(({ id }) => id === selectedId));
        }
        break;
    }
  };

  return (
    <div id="tabNav">
      <div className="pannelHeader">
        <Nav variant="tabs" activeKey={selectedId} onSelect={selectTab}>
          {tabsData.length > 0 &&
            tabsData.map((tabData, index) => {
              return (
                <div key={index} onContextMenu={(e) => closeOtherTabs(e, index)}>
                  <Nav.Item>
                    <Nav.Link eventKey={tabData.id}>
                      {
                        <>
                          {tabData.text.substring(0, 15) + "..."}
                          <div className="tabCloseContainer">
                            <div
                              className="tabCloseHover"
                              onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                                e.stopPropagation();
                                closeTab(index);
                              }}
                            >
                              <div className="tabClose"></div>
                            </div>
                          </div>
                        </>
                      }
                    </Nav.Link>
                  </Nav.Item>
                </div>
              );
            })}
        </Nav>
        {tabsData.length > 1 && (
          <div id="pannelCloseContainer" onClick={closeAllTabs}>
            <div className="pannelClose"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TabNav;
