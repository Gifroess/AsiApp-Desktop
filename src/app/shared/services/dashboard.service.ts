import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';

import {
  DashboardMetrics,
  PortalBjIndicator
} from '../interfaces/dashboard-interface';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private firestore: AngularFirestore,
    private injector: EnvironmentInjector
  ) {}


  //carrega o resumo financeiro do ano
  listarMetricas(ano: number): Observable<DashboardMetrics | null> {
    return runInInjectionContext(
      this.injector,
      () => this.firestore
        .collection<DashboardMetrics>('dashboard_metrics')
        .doc(String(ano))
        .valueChanges()
    ).pipe(
      map(dados => dados ?? null)
    );
  }


  //carrega os indicadores do portal bj
  listarIndicadores(ano: number): Observable<PortalBjIndicator[]> {
    return runInInjectionContext(
      this.injector,
      () => this.firestore
        .collection<PortalBjIndicator>('portal_bj_indicators')
        .valueChanges({ idField: 'id' })
    ).pipe(
      map(indicadores =>
        indicadores
          .filter(indicador => indicador.year === ano)
          .sort((a, b) => a.order - b.order)
      )
    );
  }
}