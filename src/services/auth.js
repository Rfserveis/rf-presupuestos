const USERS_DB = [
  { id: '1', email: 'demo@rfserveis.com', name: 'Usuario Demo', role: 'user' },
  { id: '2', email: 'admin@rfserveis.com', name: 'Admin Demo', role: 'admin' }
];

export const signIn = async (email, password) => {
  const user = USERS_DB.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return {
    user: user.id,
    profile: user
  };
};

export const signOut = async () => {
  localStorage.removeItem('rfAuthUser');
};

export const getCurrentUser = async () => {
  const stored = localStorage.getItem('rfAuthUser');
  return stored ? JSON.parse(stored) : null;
};

export const isAdmin = (user) => {
  return user?.role === 'admin';
};

export const isUsuario = (user) => {
  return user?.role === 'user';
};
