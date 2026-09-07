import { UserInterface } from './user-interface';

export type Role = UserInterface['role'];
export type StatusMembro = UserInterface['status'];

export interface Membro extends UserInterface {
  id: string;
  area?: string;
}

export const ROLES_NIVEL_DIRETORIA: Role[] = ['Diretoria', 'Vice-Presidência', 'Presidência'];
export const ROLES_NIVEL_GERENCIA: Role[] = ['Gerência'];