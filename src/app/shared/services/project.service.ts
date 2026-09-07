import {
  EnvironmentInjector,
  Injectable,
  runInInjectionContext
} from '@angular/core';

import {
  AngularFirestore
} from '@angular/fire/compat/firestore';

import {
  map,
  Observable
} from 'rxjs';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import {
  ProjectInterface
} from '../interfaces/project-interface';

import {
  UserInterface
} from '../interfaces/user-interface';


export interface UsuarioProjeto
  extends UserInterface {

  id: string;
}


export interface ProjectPayload {

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

  deadline: Date | null;

  description: string;
}


@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(
    private firestore: AngularFirestore,
    private injector: EnvironmentInjector
  ) {}


  //lista os projetos cadastrados
  listarProjetos():
    Observable<ProjectInterface[]> {

    return runInInjectionContext(
      this.injector,
      () =>
        this.firestore
          .collection<ProjectInterface>(
            'projects'
          )
          .snapshotChanges()
    ).pipe(

      map(actions =>
        actions.map(action => {

          const dados =
            action.payload.doc.data();

          const id =
            action.payload.doc.id;


          return {
            id,
            ...dados
          };

        })
      )

    );
  }


  //lista os usuarios cadastrados
  listarUsuarios():
    Observable<UsuarioProjeto[]> {

    return runInInjectionContext(
      this.injector,
      () =>
        this.firestore
          .collection<UserInterface>(
            'users'
          )
          .snapshotChanges()
    ).pipe(

      map(actions =>
        actions.map(action => {

          const dados =
            action.payload.doc.data();

          const id =
            action.payload.doc.id;


          return {
            id,
            ...dados
          };

        })
      )

    );
  }


  //cadastra um novo projeto
  async cadastrarProjeto(
    dados: ProjectPayload
  ): Promise<void> {

    const usuario =
      this.firestore
        .firestore
        .app
        .auth()
        .currentUser;


    if (!usuario) {

      throw new Error(
        'Usuário não autenticado.'
      );
    }


    await this.firestore
      .firestore
      .collection('projects')
      .add({

        ...dados,

        createdBy:
          usuario.uid,

        createdAt:
          new Date(),

        updatedAt:
          new Date()

      });
  }


  //atualiza um projeto
  async atualizarProjeto(
    projectId: string,
    dados: ProjectPayload
  ): Promise<void> {

    await this.firestore
      .firestore
      .collection('projects')
      .doc(projectId)
      .update({

        ...dados,

        updatedAt:
          new Date()

      });
  }


  //exclui um projeto
  async excluirProjeto(
    projectId: string
  ): Promise<void> {

    await this.firestore
      .firestore
      .collection('projects')
      .doc(projectId)
      .delete();
  }


  //atualiza somente o prazo
  async atualizarPrazo(
    projectId: string,
    deadline: Date | null
  ): Promise<void> {

    await this.firestore
      .firestore
      .collection('projects')
      .doc(projectId)
      .update({

        deadline,

        updatedAt:
          new Date()

      });
  }
}