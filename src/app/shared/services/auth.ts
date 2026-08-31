import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { Observable, of, switchMap, map } from 'rxjs';
import { UserInterface } from '../interfaces/user-interface';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(
        private auth: AngularFireAuth,
        private firestore: AngularFirestore,
        private router: Router
    ) {}

    // ---------- CADASTRO ----------
    async cadastro(name: string, email: string, password: string, confirmPassword: string) {
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }

        if (!this.isCorporateEmail(email)) {
            throw new Error('Utilize um e-mail corporativo (@asimovjr.com.br).');
        }

        const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user) {
            const userData: UserInterface = {
                name: name,
                email: email,
                cargo: 'Membro',
                status: 'Ativo'
            };

            await this.salvarDados(user.uid, userData);
            await user.sendEmailVerification();
            await this.auth.signOut();
        }
    }

    private salvarDados(id: string, user: UserInterface) {
        return this.firestore.collection('usuarios').doc(id).set(user);
    }

    private isCorporateEmail(email: string): boolean {
        return email.trim().toLowerCase().endsWith('@asimovjr.com.br');
    }

    // ---------- LOGIN ----------
    async login(email: string, password: string) {
        const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (!user?.emailVerified) {
            await this.auth.signOut();
            throw new Error('E-mail ainda não verificado. Confira sua caixa de entrada.');
        }

        this.router.navigate(['/home']);
    }

    // ---------- LOGIN COM GOOGLE (apenas para e-mails já cadastrados) ----------
    async loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await this.auth.signInWithPopup(provider);
        const user = userCredential.user;

        if (!user) {
            throw new Error('Não foi possível autenticar com o Google.');
        }

        const doc = await this.firestore.collection('usuarios').doc(user.uid).get().toPromise();

        if (!doc?.exists) {
            // e-mail não estava previamente cadastrado -> bloqueia acesso
            await this.auth.signOut();
            throw new Error('E-mail não cadastrado. Realize o cadastro antes de entrar com o Google.');
        }

        this.router.navigate(['/home']);
    }

    // ---------- RECUPERAR SENHA (link nativo do Firebase) ----------
    async redefinirSenha(email: string) {
        await this.auth.sendPasswordResetEmail(email);
    }

    // ---------- LOGOUT ----------
    async logout() {
        await this.auth.signOut();
        this.router.navigate(['/login']);
    }

    // ---------- DADOS DO USUÁRIO LOGADO ----------
    getUserData(): Observable<UserInterface | null> {
        return this.auth.authState.pipe(
            switchMap(user => {
                if (user) {
                    return this.firestore.collection<UserInterface>('usuarios').doc(user.uid).valueChanges();
                } else {
                    return of(null);
                }
            }),
            map(data => data ?? null)   // correção
        );
    }

    async getUid(): Promise<string | null> {
        const user = await firstValueFrom(this.auth.authState);
        return user ? user.uid : null;
    }
}