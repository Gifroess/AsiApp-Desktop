import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
import { UserInterface } from '../interfaces/user-interface';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private injector: EnvironmentInjector
  ) {}


  // ---------- CADASTRO ----------

  async cadastro(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<void> {

    if (password !== confirmPassword) {
      throw new Error('As senhas não coincidem.');
    }

    if (!this.isCorporateEmail(email)) {
      throw new Error('Utilize um e-mail corporativo (@asimovjr.com.br).');
    }

    const emailFormatado =
      email.trim().toLowerCase();


    const userCredential =
      await runInInjectionContext(
        this.injector,
        () =>
          this.auth.createUserWithEmailAndPassword(
            emailFormatado,
            password
          )
      );


    const user =
      userCredential.user;


    if (!user) {
      throw new Error('Não foi possível concluir o cadastro.');
    }


    const userData: UserInterface = {

      name:
        name.trim(),

      email:
        emailFormatado,

      role:
        'Membro',

      status:
        'Ativo',

      photoUrl:
        null

    };


    // Salva os dados utilizando o mesmo UID criado pelo Firebase Authentication.
    await runInInjectionContext(
      this.injector,
      () =>
        this.salvarDados(
          user.uid,
          userData
        )
    );


    // Envia confirmação de e-mail.
    await user.sendEmailVerification();


    // Mantém o usuário deslogado até confirmar o e-mail.
    await runInInjectionContext(
      this.injector,
      () =>
        this.auth.signOut()
    );

  }



  // Salva os dados complementares do usuário no Firestore.
  private salvarDados(
    id: string,
    user: UserInterface
  ): Promise<void> {

    return this.firestore
      .collection('users')
      .doc(id)
      .set({
        ...user,
        updatedAt: new Date()
      });

  }



  // Valida se o usuário pertence ao domínio corporativo.
  private isCorporateEmail(
    email: string
  ): boolean {

    return email
      .trim()
      .toLowerCase()
      .endsWith('@asimovjr.com.br');

  }



  // ---------- LOGIN ----------

  async login(
    email: string,
    password: string
  ): Promise<void> {


    if (!this.isCorporateEmail(email)) {
      throw new Error(
        'Utilize um e-mail corporativo (@asimovjr.com.br).'
      );
    }


    const emailFormatado =
      email.trim().toLowerCase();


    const userCredential =
      await runInInjectionContext(
        this.injector,
        () =>
          this.auth.signInWithEmailAndPassword(
            emailFormatado,
            password
          )
      );


    const user =
      userCredential.user;


    if (!user) {
      throw new Error(
        'Não foi possível autenticar o usuário.'
      );
    }


    // Impede acesso antes da confirmação do e-mail.
    if (!user.emailVerified) {

      await runInInjectionContext(
        this.injector,
        () =>
          this.auth.signOut()
      );


      throw new Error(
        'E-mail ainda não verificado. Confira sua caixa de entrada.'
      );

    }


    await this.router.navigate(['/home']);

  }



  // ---------- LOGIN COM GOOGLE ----------

  async loginWithGoogle(): Promise<void> {

    const provider =
      new firebase.auth.GoogleAuthProvider();


    try {

      // Usa a mesma instância AngularFire configurada no projeto.
      const result =
        await runInInjectionContext(
          this.injector,
          () =>
            this.auth.signInWithPopup(provider)
        );


      const user =
        result.user;


      if (!user) {
        throw new Error(
          'Não foi possível autenticar com o Google.'
        );
      }


      // Permite somente contas corporativas.
      if (
        !user.email ||
        !this.isCorporateEmail(user.email)
      ) {

        await runInInjectionContext(
          this.injector,
          () =>
            this.auth.signOut()
        );


        throw new Error(
          'Utilize sua conta corporativa (@asimovjr.com.br) para entrar com o Google.'
        );

      }


      // Verifica se o usuário realmente existe no cadastro da aplicação.
      const userDoc =
        await firstValueFrom(
          this.firestore
            .collection<UserInterface>('users')
            .doc(user.uid)
            .get()
        );


      if (!userDoc.exists) {

        await runInInjectionContext(
          this.injector,
          () =>
            this.auth.signOut()
        );


        throw new Error(
          'E-mail não cadastrado. Realize o cadastro antes de entrar com o Google.'
        );

      }


      await this.router.navigate(['/home']);


    } catch(error:any) {


      // Fechar o popup não deve ser tratado como erro.
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {

        return;

      }


      throw error;

    }

  }
    // ---------- RECUPERACAO DE SENHA ----------

  async redefinirSenha(
    email: string
  ): Promise<void> {


    if (!this.isCorporateEmail(email)) {
      throw new Error(
        'Utilize um e-mail corporativo (@asimovjr.com.br).'
      );
    }


    await runInInjectionContext(
      this.injector,
      () =>
        this.auth.sendPasswordResetEmail(
          email
            .trim()
            .toLowerCase()
        )
    );

  }



  // ---------- LOGOUT ----------

  async logout():
    Promise<void> {


    await runInInjectionContext(
      this.injector,
      () =>
        this.auth.signOut()
    );


    await this.router.navigate(['/']);

  }



  // ---------- DADOS DO USUARIO ----------

  getUserData():
    Observable<UserInterface | null> {


    return this.auth.authState.pipe(

      switchMap(user => {


        if (!user) {
          return of(null);
        }


        return runInInjectionContext(
          this.injector,
          () =>
            this.firestore
              .collection<UserInterface>('users')
              .doc(user.uid)
              .valueChanges()
        );

      }),


      map(data =>
        data ?? null
      )

    );

  }



  // ---------- UID ----------

  async getUid():
    Promise<string | null> {


    const user =
      await firstValueFrom(
        this.auth.authState
      );


    return user?.uid ?? null;

  }



  // ---------- AUTENTICACAO ----------

  isAuthenticated():
    Observable<boolean> {


    return this.auth
      .authState
      .pipe(
        map(user =>
          !!user
        )
      );

  }

}