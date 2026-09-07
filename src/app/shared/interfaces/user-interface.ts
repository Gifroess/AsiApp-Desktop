import firebase from 'firebase/compat/app';

export type UserRole =
  | 'Membro'
  | 'RH'
  | 'Gerência'
  | 'Vice-Presidência'
  | 'Diretoria'
  | 'Presidência'
  | 'Administrador';

export interface UserInterface {
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string | null;
  updatedAt?: firebase.firestore.Timestamp | Date;
}