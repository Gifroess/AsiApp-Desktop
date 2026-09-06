import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map, of, delay } from 'rxjs';
import { Membro, Role } from '../interfaces/membro-interface';
import { UserInterface } from '../interfaces/user-interface';


const USAR_MOCK = true;

const MOCK_MEMBROS: Membro[] = [
  { id: '1', name: 'Ana Beatriz Souza', email: 'ana.souza@asimovjr.com.br', role: 'Presidência', status: 'Ativo', area: 'Diretoria Executiva' },
  { id: '2', name: 'Carlos Eduardo Lima', email: 'carlos.lima@asimovjr.com.br', role: 'Diretoria', status: 'Ativo', area: 'Marketing e Design' },
  { id: '3', name: 'Fernanda Martins', email: 'fernanda.martins@asimovjr.com.br', role: 'Diretoria', status: 'Ativo', area: 'Desktop' },
  { id: '4', name: 'Gabriel Rocha', email: 'gabriel.rocha@asimovjr.com.br', role: 'Vice-Presidência', status: 'Ativo', area: 'Diretoria Executiva' },
  { id: '5', name: 'Juliana Alves', email: 'juliana.alves@asimovjr.com.br', role: 'Gerência', status: 'Ativo', area: 'Mobile' },
  { id: '6', name: 'Lucas Pereira', email: 'lucas.pereira@asimovjr.com.br', role: 'Gerência', status: 'Ativo', area: 'Marketing e Design' },
  { id: '7', name: 'Mariana Costa', email: 'mariana.costa@asimovjr.com.br', role: 'Gerência', status: 'Inativo', area: 'Desktop' },
  { id: '8', name: 'Pedro Henrique Dias', email: 'pedro.dias@asimovjr.com.br', role: 'Membro', status: 'Ativo', area: 'Desktop' },
  { id: '9', name: 'Rafaela Nunes', email: 'rafaela.nunes@asimovjr.com.br', role: 'Membro', status: 'Ativo', area: 'Mobile' },
  { id: '10', name: 'Thiago Barbosa', email: 'thiago.barbosa@asimovjr.com.br', role: 'Membro', status: 'Ativo', area: 'Marketing e Design' },
  { id: '11', name: 'Vitória Ramos', email: 'vitoria.ramos@asimovjr.com.br', role: 'Membro', status: 'Inativo', area: 'Mobile' },
  { id: '12', name: 'Bruno Teixeira', email: 'bruno.teixeira@asimovjr.com.br', role: 'Aguardando atribuição', status: 'Ativo', area: undefined },
];

@Injectable({ providedIn: 'root' })
export class MembrosService {
  constructor(
    private firestore: AngularFirestore,
    private injector: EnvironmentInjector
  ) {}

  listar(): Observable<Membro[]> {
    if (USAR_MOCK) {
      return of(MOCK_MEMBROS).pipe(delay(400));
    }

    return runInInjectionContext(this.injector, () =>
      this.firestore
        .collection<UserInterface>('usuarios')
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
    if (USAR_MOCK) {
      const membro = MOCK_MEMBROS.find((m) => m.id === id);
      if (membro) {
        membro.role = dados.role;
        membro.area = dados.area;
      }
      return Promise.resolve();
    }

    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('usuarios').doc(id).update(dados)
    );
  }

  atualizarRole(id: string, role: Role): Promise<void> {
    if (USAR_MOCK) {
      const membro = MOCK_MEMBROS.find((m) => m.id === id);
      if (membro) membro.role = role;
      return Promise.resolve();
    }

    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('usuarios').doc(id).update({ role })
    );
  }

  atualizarStatus(id: string, status: UserInterface['status']): Promise<void> {
    if (USAR_MOCK) {
      const membro = MOCK_MEMBROS.find((m) => m.id === id);
      if (membro) membro.status = status;
      return Promise.resolve();
    }

    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('usuarios').doc(id).update({ status })
    );
  }

  remover(id: string): Promise<void> {
    if (USAR_MOCK) {
      const index = MOCK_MEMBROS.findIndex((m) => m.id === id);
      if (index >= 0) MOCK_MEMBROS.splice(index, 1);
      return Promise.resolve();
    }

    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('usuarios').doc(id).delete()
    );
  }
}