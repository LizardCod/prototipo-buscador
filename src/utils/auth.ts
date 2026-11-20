export type UserRole = 'admin' | 'client';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  permissionsSummary: string;
}

export const TEST_USERS: AppUser[] = [
  {
    id: 'user-admin',
    name: 'Carlos Méndez',
    email: 'admin@prototipo.local',
    password: 'admin123',
    role: 'admin',
    roleLabel: 'Administrador',
    permissionsSummary:
      'Importa archivos Excel, configura módulos y sube archivos en Descargas.',
  },
  {
    id: 'user-client',
    name: 'Laura Gómez',
    email: 'cliente@prototipo.local',
    password: 'cliente123',
    role: 'client',
    roleLabel: 'Cliente (Solo lectura)',
    permissionsSummary:
      'Busca registros, filtra, expande tarjetas y descarga los archivos subidos por el administrador.',
  },
];

export function authenticateUser(
  email: string,
  password: string
): AppUser | null {
  const cleanEmail = email.trim().toLowerCase();
  return (
    TEST_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    ) || null
  );
}
