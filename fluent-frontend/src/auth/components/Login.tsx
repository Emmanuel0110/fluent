import React, { useState } from "react";
import { login } from "../authActions";
import { Link, Navigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { isAuthenticated, setIsAuthenticated, setUser } = useAuth();

  const onSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    login({ username, password }, setIsAuthenticated, setUser);
  };

  if (isAuthenticated) {
    return <Navigate to="/review" />;
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
