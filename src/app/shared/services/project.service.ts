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

import {
  ProjectInterface
} from '../interfaces/project-interface';


@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(
    private firestore: AngularFirestore,
    private injector: EnvironmentInjector
  ) {}


  //lista os projetos cadastrados
  listarProjetos(): Observable<ProjectInterface[]> {

    return runInInjectionContext(
      this.injector,
      () =>
        this.firestore
          .collection<ProjectInterface>('projects')
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


  //atualiza o prazo de um projeto
  async atualizarPrazo(
    projectId: string,
    deadline: Date | null
  ): Promise<void> {

    await this.firestore
      .collection('projects')
      .doc(projectId)
      .update({

        deadline,

        updatedAt: new Date()

      });
  }
}