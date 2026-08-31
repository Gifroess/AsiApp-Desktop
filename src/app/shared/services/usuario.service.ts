import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  // Atualiza o nome no documento do Firestore 
  async atualizarNome(uid: string, novoNome: string): Promise<void> {
    await this.firestore.collection('usuarios').doc(uid).update({ name: novoNome });
  }

  // Troca senha - exige reautenticação recente 
  async trocarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user || !user.email) {
      throw new Error('Usuário não autenticado.');
    }

    const credential = firebase.auth.EmailAuthProvider.credential(user.email, senhaAtual);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(novaSenha);
  }

  // Atualiza a URL da foto no documento do usuário
  async atualizarFotoUrl(uid: string, url: string): Promise<void> {
    await this.firestore.collection('usuarios').doc(uid).update({ fotoUrl: url });
  }
}