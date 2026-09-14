import {
  Injectable,
  EnvironmentInjector,
  runInInjectionContext
} from '@angular/core';

import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Observable } from 'rxjs';

import {
  FinancialEntry,
  FinancialEntryType
} from '../interfaces/financial-interface';

export interface FinancialFilters {
  type?: FinancialEntryType | '';
  category?: string;
  supplier?: string;
  minAmount?: number | null;
  maxAmount?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialService {

  constructor(
    private firestore: AngularFirestore,
    private injector: EnvironmentInjector
  ) {}

  listarLancamentos(
    filtros: FinancialFilters = {}
  ): Observable<FinancialEntry[]> {

    return runInInjectionContext(this.injector, () =>
      this.firestore.collection<FinancialEntry>(
        'financial_entries',
        ref => {

          // O AngularFire retorna CollectionReference inicialmente,
          // mas .where() retorna Query.
          // Usamos uma variável sem tipagem explícita para permitir
          // o encadeamento dos filtros.
          let query: any = ref;

          if (filtros.type) {
            query = query.where(
              'type',
              '==',
              filtros.type
            );
          }

          if (filtros.category) {
            query = query.where(
              'category',
              '==',
              filtros.category
            );
          }

          if (filtros.supplier) {
            query = query.where(
              'supplier',
              '==',
              filtros.supplier
            );
          }

          if (
            filtros.minAmount !== null &&
            filtros.minAmount !== undefined
          ) {
            query = query.where(
              'amount',
              '>=',
              filtros.minAmount
            );
          }

          if (
            filtros.maxAmount !== null &&
            filtros.maxAmount !== undefined
          ) {
            query = query.where(
              'amount',
              '<=',
              filtros.maxAmount
            );
          }

          if (filtros.startDate) {
            query = query.where(
              'date',
              '>=',
              this.inicioDoDia(filtros.startDate)
            );
          }

          if (filtros.endDate) {
            query = query.where(
              'date',
              '<=',
              this.fimDoDia(filtros.endDate)
            );
          }

          return query;
        }
      ).valueChanges({
        idField: 'id'
      })
    );
  }

  async adicionarLancamento(
    lancamento: Omit<FinancialEntry, 'id'>
  ): Promise<void> {

    await runInInjectionContext(this.injector, () =>
      this.firestore
        .collection<FinancialEntry>('financial_entries')
        .add(lancamento)
    );
  }

  async atualizarLancamento(
    id: string,
    dados: Partial<FinancialEntry>
  ): Promise<void> {

    await runInInjectionContext(this.injector, () =>
      this.firestore
        .collection<FinancialEntry>('financial_entries')
        .doc(id)
        .update(dados)
    );
  }

  async excluirLancamento(
    id: string
  ): Promise<void> {

    await runInInjectionContext(this.injector, () =>
      this.firestore
        .collection('financial_entries')
        .doc(id)
        .delete()
    );
  }

  private inicioDoDia(data: Date): Date {

    const inicio = new Date(data);

    inicio.setHours(0, 0, 0, 0);

    return inicio;
  }

  private fimDoDia(data: Date): Date {

    const fim = new Date(data);

    fim.setHours(23, 59, 59, 999);

    return fim;
  }
}