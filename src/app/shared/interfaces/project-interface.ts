import firebase from 'firebase/compat/app';

export interface ProjectInterface {
  id?: string;

  name: string;
  client: string;
  area: string;

  manager: string;
  managerId: string;

  memberIds: string[];
  members: string;

  progress: number;
  status: string;
  color: string;
  value: string;

  createdBy: string;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;

  //campos que ainda não existem em todos os projetos do mobile
  deadline?: firebase.firestore.Timestamp | null;
  description?: string;
}