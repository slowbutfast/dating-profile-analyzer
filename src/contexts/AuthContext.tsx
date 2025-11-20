import { createContext, useContext } from 'react';

// Dummy user object
const dummyUser = { id: 'demo', email: 'demo@example.com' };

const AuthContext = createContext({
  user: dummyUser,
  session: null,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  loading: false,
});

export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={{
    user: dummyUser,
    session: null,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signOut: async () => {},
    loading: false,
  }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);
