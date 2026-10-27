import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api, { pickError, resetClientSession } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const revision = useRef(0);
  const identityRevision = useRef(0);
  const profileWrites = useRef({ name: 0, phone: 0 });
  const inFlight = useRef(null);
  const mounted = useRef(true);

  const refresh = useCallback(() => {
    const current = revision.current;
    if (inFlight.current?.revision === current) return inFlight.current.promise;
    setAuthError("");
    const flight = { revision: current };
    flight.promise = api.get("/auth/session").then(({ data }) => {
      if (!data || !Object.prototype.hasOwnProperty.call(data, "user")) throw new Error("پاسخ حساب معتبر نیست.");
      if (mounted.current && revision.current === current) {
        setUser(data.user || null);
        setAuthError("");
      }
      return data.user || null;
    }).catch(error => {
      if (mounted.current && revision.current === current) {
        if (error?.response?.status === 401) {
          revision.current += 1;
          setUser(null);
        } else {
          if (error?.response?.status === 403) setUser(null);
          setAuthError(error?.response?.status === 403 ? pickError(error) : "دریافت اطلاعات حساب انجام نشد. اتصال را بررسی و دوباره تلاش کن.");
        }
      }
      throw error;
    }).finally(() => { if (inFlight.current === flight) inFlight.current = null; });
    inFlight.current = flight;
    return flight.promise;
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    // A cookie session survives reload and also works when browser storage is unavailable.
    try { localStorage.removeItem("access_token"); } catch {}
    const expired = () => {
      identityRevision.current += 1;
      revision.current += 1;
      inFlight.current = null;
      setUser(null);
      setAuthError("");
    };
    window.addEventListener("auth:expired", expired);
    refresh().catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; window.removeEventListener("auth:expired", expired); };
  }, [refresh]);

  const acceptSession = (data, current) => {
    if (!data.user) throw new Error("پاسخ ورود معتبر نیست. دوباره تلاش کن.");
    if (revision.current !== current) throw new Error("نشست حساب تغییر کرده است.");
    resetClientSession();
    setAuthError("");
    setUser(data.user);
    return data.user;
  };
  const startEntry = () => {
    identityRevision.current += 1;
    revision.current += 1;
    resetClientSession();
    return revision.current;
  };
  const login = async (email, password) => {
    const current = startEntry();
    const { data } = await api.post("/auth/login", { email, password });
    return acceptSession(data, current);
  };
  const register = async (email, password) => {
    const current = startEntry();
    const { data } = await api.post("/auth/register", { email, password });
    if (data.confirmation_required) return data;
    return acceptSession(data, current);
  };
  const confirmEmail = async (input) => {
    const current = startEntry();
    const { data } = await api.post(input.code ? "/auth/exchange" : "/auth/verify-email", input);
    return acceptSession(data, current);
  };
  const updateProfile = async (name) => {
    const identity = identityRevision.current;
    const write = ++profileWrites.current.name;
    revision.current += 1;
    const { data } = await api.patch("/auth/me", { name });
    if (identityRevision.current === identity && profileWrites.current.name === write) {
      revision.current += 1;
      setUser(previous => previous?.id === data.id ? { ...previous, name: data.name } : previous);
    }
    return data;
  };
  const updatePhone = async (phone) => {
    const identity = identityRevision.current;
    const write = ++profileWrites.current.phone;
    revision.current += 1;
    const { data } = await api.patch("/auth/phone", { phone });
    if (identityRevision.current === identity && profileWrites.current.phone === write) {
      revision.current += 1;
      setUser(previous => previous?.id === data.id ? { ...previous, phone: data.phone, phone_verified: data.phone_verified } : previous);
    }
    return data;
  };
  const logout = async () => {
    identityRevision.current += 1;
    revision.current += 1;
    resetClientSession();
    // Don't report success when the server could not clear the HttpOnly cookies.
    await api.post("/auth/logout");
    setUser(null);
    setAuthError("");
  };

  return <AuthContext.Provider value={{ user, loading, authError, login, register, confirmEmail, updateProfile, updatePhone, logout, refresh, setUser, pickError }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
