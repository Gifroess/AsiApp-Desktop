import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}


  //atualiza o nome no documento do usuário
  async atualizarNome(
    uid: string,
    novoNome: string
  ): Promise<void> {

    await this.firestore
      .collection('users')
      .doc(uid)
      .update({
        name: novoNome.trim(),
        updatedAt: new Date()
      });
  }


  //troca a senha após reautenticar o usuário
  async trocarSenha(
    senhaAtual: string,
    novaSenha: string
  ): Promise<void> {

    const user = await this.afAuth.currentUser;

    if (!user || !user.email) {
      throw new Error('Usuário não autenticado.');
    }

    const credential =
      firebase.auth.EmailAuthProvider.credential(
        user.email,
        senhaAtual
      );

    await user.reauthenticateWithCredential(credential);

    await user.updatePassword(novaSenha);
  }


  //atualiza a url da foto no documento do usuário
  async atualizarFotoUrl(
    uid: string,
    url: string
  ): Promise<void> {

    await this.firestore
      .collection('users')
      .doc(uid)
      .update({
        photoUrl: url,
        updatedAt: new Date()
      });
  }
}