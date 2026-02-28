import { Outlet } from "react-router";
import LeftMenuBar from "./LeftMenuBar";
import Navbar from "./Navbar";
import { useData } from "../../contexts/DataContext";
import "./layout.css";
import { useState } from "react";

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { loadError } = useData();
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  return (
    <div id="container">
      <Navbar onMenuToggle={toggleMenu} />
      <LeftMenuBar isOpen={isMenuOpen} setOpen={setIsMenuOpen} />
      {loadError && (
        <div className="alert alert-warning m-2 mb-0" role="alert">
          {loadError} You can try refreshing or <a href="/profile">check your settings</a>.
        </div>
      )}
      <div id="mainPannel">
        <div id="mainArea">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
