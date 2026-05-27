export const getRegisteredUsers = () => JSON.parse(localStorage.getItem('siteSurveyRegisteredUsers') || '[]');

export const saveRegisteredUsers = (users) => {
  localStorage.setItem('siteSurveyRegisteredUsers', JSON.stringify(users));
};

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBuffer = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

const derivePasswordHash = async (password, salt) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 120000,
    },
    keyMaterial,
    256
  );

  return bufferToBase64(bits);
};

export const createPasswordRecord = async (password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    passwordHash: await derivePasswordHash(password, salt),
    passwordSalt: bufferToBase64(salt),
    passwordAlgorithm: 'PBKDF2-SHA256',
    passwordIterations: 120000,
  };
};

export const verifyPassword = async (user, password) => {
  if (user.passwordHash && user.passwordSalt) {
    const hash = await derivePasswordHash(password, base64ToBuffer(user.passwordSalt));
    return hash === user.passwordHash;
  }

  return user.password === password;
};

export const upgradeLegacyPassword = async (email, password) => {
  const users = getRegisteredUsers();
  const nextUsers = await Promise.all(users.map(async (user) => {
    if (user.email.toLowerCase() !== email.toLowerCase() || !user.password) return user;
    const passwordRecord = await createPasswordRecord(password);
    const { password: _legacyPassword, ...safeUser } = user;
    return { ...safeUser, ...passwordRecord };
  }));
  saveRegisteredUsers(nextUsers);
};

export const removeReadablePasswords = () => {
  const users = getRegisteredUsers();
  if (!users.some((user) => user.password)) return;

  saveRegisteredUsers(users.map((user) => {
    if (!user.password) return user;
    const { password: _legacyPassword, ...safeUser } = user;
    return {
      ...safeUser,
      passwordMigrationRequired: true,
    };
  }));
};

export const needsPasswordReset = (user) => Boolean(user.passwordMigrationRequired && !user.passwordHash);

export const createSession = (user) => {
  const session = {
    token: user.accessToken || `local-${crypto.randomUUID()}`,
    refreshToken: user.refreshToken || null,
    email: user.email,
    name: user.name || user.fullName,
    role: user.role,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem('siteSurveySession', JSON.stringify(session));
  localStorage.setItem('siteSurveyUser', JSON.stringify({
    email: user.email,
    name: user.name || user.fullName,
    role: user.role,
  }));
  return session;
};

export const getSession = () => JSON.parse(localStorage.getItem('siteSurveySession') || 'null');

export const clearSession = () => {
  localStorage.removeItem('siteSurveySession');
  localStorage.removeItem('siteSurveyUser');
};

export const updateSessionProfile = ({ name, role }) => {
  const session = getSession();
  if (session) {
    localStorage.setItem('siteSurveySession', JSON.stringify({ ...session, name, role }));
  }
  const user = JSON.parse(localStorage.getItem('siteSurveyUser') || '{}');
  localStorage.setItem('siteSurveyUser', JSON.stringify({ ...user, name, role }));
};

export const roleAccess = {
  'Field Engineer': ['/dashboard', '/properties', '/floor-plans', '/mapping', '/survey', '/reports', '/settings', '/profile'],
  'Network Planner': ['/dashboard', '/properties', '/floor-plans', '/mapping', '/reports', '/settings', '/profile'],
  'Operations Manager': ['/dashboard', '/properties', '/reports', '/settings', '/profile'],
};

export const canAccessPath = (role, path) => {
  const allowed = roleAccess[role] || [];
  return allowed.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`));
};

export const getDefaultPathForRole = (role) => {
  return roleAccess[role]?.[0] || '/dashboard';
};
