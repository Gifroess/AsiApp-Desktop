import {
  EnvironmentInjector,
  Injectable,
  runInInjectionContext
} from '@angular/core';

import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import {
  firstValueFrom,
  map,
  Observable,
  of,
  switchMap
} from 'rxjs';

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
      throw new Error(
        'Utilize um e-mail corporativo (@asimovjr.com.br).'
      );
    }

    const emailFormatado = email
      .trim()
      .toLowerCase();

    const userCredential = await runInInjectionContext(
      this.injector,
      () =>
        this.auth.createUserWithEmailAndPassword(
          emailFormatado,
          password
        )
    );

    const user = userCredential.user;

    if (!user) {
      throw new Error(
        'Não foi possível concluir o cadastro.'
      );
    }

    const userData: UserInterface = {
      name: name.trim(),
      email: emailFormatado,
      role: 'Membro',
      photoUrl: null
    };

    //salva os dados usando o mesmo uid do Authentication
    await runInInjectionContext(
      this.injector,
      () => this.salvarDados(
        user.uid,
        userData
      )
    );

    //envia o e-mail de verificação
    await user.sendEmailVerification();

    //encerra a sessão até a confirmação do e-mail
    await runInInjectionContext(
      this.injector,
      () => this.auth.signOut()
    );
  }


  //salva os dados na coleção compartilhada com o mobile
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


  //valida o domínio corporativo
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

    const emailFormatado = email
      .trim()
      .toLowerCase();

    const userCredential = await runInInjectionContext(
      this.injector,
      () =>
        this.auth.signInWithEmailAndPassword(
          emailFormatado,
          password
        )
    );

    const user = userCredential.user;

    if (!user) {
      throw new Error(
        'Não foi possível autenticar o usuário.'
      );
    }

    //impede login antes da confirmação do e-mail
    if (!user.emailVerified) {

      await runInInjectionContext(
        this.injector,
        () => this.auth.signOut()
      );

      throw new Error(
        'E-mail ainda não verificado. Confira sua caixa de entrada.'
      );
    }

    //temporariamente direciona para gestão de projetos
    await this.router.navigate(['/projetos']);
  }


  // ---------- LOGIN COM GOOGLE ----------

  async loginWithGoogle(): Promise<void> {

    const provider =
      new firebase.auth.GoogleAuthProvider();

    const userCredential = await runInInjectionContext(
      this.injector,
      () => this.auth.signInWithPopup(provider)
    );

    const user = userCredential.user;

    if (!user) {
      throw new Error(
        'Não foi possível autenticar com o Google.'
      );
    }

    //google só pode ser usado por usuários já cadastrados
    const userDoc = await runInInjectionContext(
      this.injector,
      () =>
        firstValueFrom(
          this.firestore
            .collection<UserInterface>('users')
            .doc(user.uid)
            .get()
        )
    );

    if (!userDoc.exists) {

      await runInInjectionContext(
        this.injector,
        () => this.auth.signOut()
      );

      throw new Error(
        'E-mail não cadastrado. Realize o cadastro antes de entrar com o Google.'
      );
    }

    await this.router.navigate(['/projetos']);
  }


  // ---------- RECUPERAÇÃO DE SENHA ----------

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
          email.trim().toLowerCase()
        )
    );
  }


  // ---------- LOGOUT ----------

  async logout(): Promise<void> {

    await runInInjectionContext(
      this.injector,
      () => this.auth.signOut()
    );

    await this.router.navigate(['/']);
  }


  // ---------- DADOS DO USUÁRIO ----------

  getUserData(): Observable<UserInterface | null> {

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

      map(data => data ?? null)
    );
  }


  // ---------- UID ----------

  async getUid(): Promise<string | null> {

    const user = await firstValueFrom(
      this.auth.authState
    );

    return user?.uid ?? null;
  }


  // ---------- AUTENTICAÇÃO ----------

  isAuthenticated(): Observable<boolean> {

    return this.auth.authState.pipe(
      map(user => !!user)
    );
  }
}