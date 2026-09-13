import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  async atualizarNome(uid: string, novoNome: string): Promise<void> {
    await this.firestore.firestore
      .collection('users')
      .doc(uid)
      .update({
        name: novoNome.trim(),
        updatedAt: new Date()
      });
  }

  async trocarSenha(
    senhaAtual: string,
    novaSenha: string
  ): Promise<void> {

    const user = await firstValueFrom(this.afAuth.authState);

    if (!user || !user.email) {
      throw new Error('Usuário não autenticado.');
    }

    if (!senhaAtual || !novaSenha) {
      throw new Error('Informe a senha atual e a nova senha.');
    }

    if (novaSenha.length < 6) {
      throw new Error('A nova senha deve possuir pelo menos 6 caracteres.');
    }

    try {
      // Cria a credencial de e-mail e senha
      const credential =
        firebase.auth.EmailAuthProvider.credential(
          user.email,
          senhaAtual
        );

      // Reautentica o usuário
      await user.reauthenticateWithCredential(credential);

      // Atualiza a senha
      await user.updatePassword(novaSenha);

    } catch (error: any) {

      console.error('Erro ao alterar senha:', error);
      console.error('Código:', error?.code);
      console.error('Mensagem:', error?.message);

      if (
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/invalid-login-credentials'
      ) {
        throw new Error('Senha atual incorreta.');
      }

      if (error?.code === 'auth/weak-password') {
        throw new Error(
          'A nova senha deve possuir pelo menos 6 caracteres.'
        );
      }

      throw error;
    }
  }

  async atualizarFotoUrl(uid: string, url: string): Promise<void> {
    await this.firestore.firestore
      .collection('users')
      .doc(uid)
      .update({
        photoUrl: url,
        updatedAt: new Date()
      });
  }
}