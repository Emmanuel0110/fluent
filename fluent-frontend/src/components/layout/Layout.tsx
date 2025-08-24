import { Outlet } from "react-router";
import LeftMenuBar from "./LeftMenuBar";
import Navbar from "./Navbar";
import "./layout.css";
import { useState } from "react";

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  return (
    <div id="container">
      <Navbar isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
      <LeftMenuBar isOpen={isMenuOpen} />
      <div id="mainPannel">
        <div id="mainArea">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
