import React, { useState } from "react";
import { login } from "../authActions";
import { Link, Navigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

function Login({
  isAuthenticated,
  setIsAuthenticated,
  setUser,
}: {
  isAuthenticated: boolean | null;
  setIsAuthenticated: (b: boolean) => void;
  setUser: (user: any) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    login({ username, password }, setIsAuthenticated, setUser);
  };

  if (isAuthenticated) {
    return <Navigate to="/words" />;
  }
  return (
    <>
      <div id="loginNavbar" className="navb">
        <Link className="navButton" to="/register">
          Register
        </Link>
      </div>
      <Form id="loginForm">
        <Form.Group className="formgroup">
          <Form.Label>Username</Form.Label>
          <Form.Control
            id="username"
            name="username"
            type="text"
            onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
          />
        </Form.Group>
        <Form.Group className="formgroup">
          <Form.Label>Password</Form.Label>
          <Form.Control
            id="password"
            name="password"
            type="password"
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
          />
        </Form.Group>
        <Button onClick={onSubmit}>Login</Button>
      </Form>
    </>
  );
}

export default Login;
