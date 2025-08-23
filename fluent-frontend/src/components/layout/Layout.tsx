import { Outlet } from "react-router";
import LeftMenuBar from "./LeftMenuBar";
import Navbar from "./Navbar";
import "./layout.css";

function Layout() {
  return (
    <div id="container">
      <Navbar />
      <LeftMenuBar />
      <div id="mainPannel">
        <div id="mainArea">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
