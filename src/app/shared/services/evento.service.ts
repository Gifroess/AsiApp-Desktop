import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

export interface EventoFirebase {
  id?: string;
  titulo: string;
  horario: string;
  data: any;
  areas: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private colecao = 'eventos';

  constructor(private firestore: AngularFirestore) {}

  listarEventos(): Observable<EventoFirebase[]> {
    return this.firestore
      .collection<EventoFirebase>(this.colecao)
      .valueChanges({ idField: 'id' });
  }

  adicionarEvento(evento: EventoFirebase): Promise<void> {
    const id = this.firestore.createId();

    return this.firestore.firestore
      .collection(this.colecao)
      .doc(id)
      .set(evento);
  }

  atualizarEvento(id: string, evento: Partial<EventoFirebase>): Promise<void> {
    return this.firestore.firestore
      .collection(this.colecao)
      .doc(id)
      .update(evento);
  }

  excluirEvento(id: string): Promise<void> {
    return this.firestore.firestore
      .collection(this.colecao)
      .doc(id)
      .delete();
  }
}