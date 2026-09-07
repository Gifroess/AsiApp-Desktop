import firebase from 'firebase/compat/app';


export type UserRole =
  | 'Aguardando atribuição'
  | 'Membro'
  | 'RH'
  | 'Gerência'
  | 'Vice-Presidência'
  | 'Diretoria'
  | 'Presidência'
  | 'Administrador';


export type UserStatus =
  | 'Ativo'
  | 'Inativo';


export interface UserInterface {

  name: string;

  email: string;

  role: UserRole;

  status?: UserStatus;

  photoUrl?: string | null;

  fotoUrl?: string | null;

  updatedAt?:
    firebase.firestore.Timestamp |
    Date;
}