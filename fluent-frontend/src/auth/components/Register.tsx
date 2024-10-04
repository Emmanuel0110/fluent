import React, { useState } from "react";
import { register } from "../authActions";
import { Link, Navigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

function Register({
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
    register({ username, password }, setIsAuthenticated, setUser);
  };

  if (isAuthenticated) {
    return <Navigate to="/words" />;
  }
  return (
    <>
      <div id="registerNavbar" className="navb">
        <Link className="navButton" to="/login">
          Login
        </Link>
      </div>
      <Form id="registerForm">
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
        <Button onClick={onSubmit}>Register</Button>
      </Form>
    </>
  );
}

export default Register;
