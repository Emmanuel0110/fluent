import { Dispatch, SetStateAction } from "react";
import { url } from "../App";
import { User } from "../types";
import { customFetch, authHeaders } from "../utils/http-helpers";

//Check token & load user
export const loadUser = (
  setUser: Dispatch<SetStateAction<User | null>>,
  setIsAuthenticated: Dispatch<React.SetStateAction<boolean | null>>,
  setUserIsLoading: Dispatch<React.SetStateAction<boolean>>
) => {
  customFetch(url + "users/auth", { headers: authHeaders() })
    .then((res) => {
      const { user, sourceLanguage, targetLanguage } = res;
      setUser({ ...user, sourceLanguage, targetLanguage });
      setIsAuthenticated(true);
    })
    .catch((err: Error) => {
      setUser(null);
      setIsAuthenticated(false);
    })
    .finally(() => {
      setUserIsLoading(false);
    });
};

export const register = (
  { username, password }: { username: string; password: string },
  setIsAuthenticated: (b: boolean) => void,
  setUser: (user: any) => void
) => {
  const headers = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({ username, password });
  customFetch(url + "users", { method: "POST", headers, body })
    .then((res: any) => {
      if (!res.token) {
        throw Error(res.msg);
      }
      const { user, sourceLanguage, targetLanguage } = res;
      setUser({ ...user, sourceLanguage, targetLanguage });
      setIsAuthenticated(true);
      localStorage.setItem("token", res.token);
    })
    .catch((err: Error) => {
      setIsAuthenticated(false);
    });
};

export const login = (
  { username, password }: { username: string; password: string },
  setIsAuthenticated: (b: boolean) => void,
  setUser: (user: any) => void
) => {
  const headers = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({ username, password });
  customFetch(url + "users/auth", { method: "POST", headers, body })
    .then((res) => {
      if (!res.token) {
        throw Error(res.msg);
      }
      const { user, sourceLanguage, targetLanguage } = res;
      setUser({ ...user, sourceLanguage, targetLanguage });
      setIsAuthenticated(true);
      localStorage.setItem("token", res.token);
    })
    .catch((err: Error) => {
      setIsAuthenticated(false);
    });
};

//Logout User
export const logout = (setIsAuthenticated: (arg: boolean) => void) => {
  window.localStorage.clear(); //Clear out the cache
  setIsAuthenticated(false);
  //window.location.href = '/'; //Force a browser refresh to clear in-memory data
};
