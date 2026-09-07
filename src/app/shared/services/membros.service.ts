import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
import { Membro, Role } from '../interfaces/membro-interface';
import { UserInterface } from '../interfaces/user-interface';

@Injectable({ providedIn: 'root' })
export class MembrosService {
  constructor(
    private firestore: AngularFirestore,
    private injector: EnvironmentInjector
  ) {}

  listar(): Observable<Membro[]> {
    return runInInjectionContext(this.injector, () =>
      this.firestore
        .collection<UserInterface>('users')
        .valueChanges({ idField: 'id' }) as Observable<Membro[]>
    );
  }

  buscarPorNome(termo: string): Observable<Membro[]> {
    const termoLower = termo.trim().toLowerCase();
    return this.listar().pipe(
      map((membros) =>
        termoLower ? membros.filter((m) => m.name.toLowerCase().includes(termoLower)) : membros
      )
    );
  }

  atualizarDados(id: string, dados: { role: Role; area?: string }): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('users').doc(id).update(dados)
    );
  }

  atualizarRole(id: string, role: Role): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('users').doc(id).update({ role })
    );
  }

  atualizarStatus(id: string, status: UserInterface['status']): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('users').doc(id).update({ status })
    );
  }

  remover(id: string): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('users').doc(id).delete()
    );
  }
}