import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { clearToken, setToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY   = 'mxt_token';
const USER_KEY    = 'mxt_usuario';

export function AuthProvider({ children }) {
  const [usuario,       setUsuario]       = useState(null);
  const [token,         setTokenState]    = useState(null);
  const [cargando,      setCargando]      = useState(true);
  const [logoutVersion, setLogoutVersion] = useState(0);
  const expiringRef               = useRef(false);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      if (expiringRef.current) return;
      expiringRef.current = true;
      try { _cerrarSesionInterno(); }
      finally { setTimeout(() => { expiringRef.current = false; }, 500); }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Arranque: sin autologin — siempre empieza en Login
  useEffect(() => {
    (async () => {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
        clearToken();
      } finally {
        setTokenState(null);
        setUsuario(null);
        setCargando(false);
      }
    })();
  }, []);

  // Limpia estado SÍNCRONAMENTE → re-render inmediato → App.js muestra AuthStack
  // Luego borra SecureStore en background (no bloquea UI)
  const _cerrarSesionInterno = () => {
    clearToken();
    setTokenState(null);
    setUsuario(null);
    setLogoutVersion(v => v + 1);
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    console.log('[Auth] Sesión cerrada');
  };

  const login = async (nuevoToken, userData) => {
    // Persistir primero, luego actualizar estado
    await SecureStore.setItemAsync(TOKEN_KEY, nuevoToken).catch(() => {});
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData)).catch(() => {});
    setToken(nuevoToken);
    setTokenState(nuevoToken);
    setUsuario(userData);
  };

  // logout es síncrono intencionalmente — no esperar async para el re-render
  const logout = () => { _cerrarSesionInterno(); };

  return (
    <AuthContext.Provider value={{
      usuario, token, cargando, logoutVersion,
      login, logout,
      cerrarSesion:       logout,
      guardarSesion:      login,
      handleTokenExpired: logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
