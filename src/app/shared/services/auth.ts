import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { Observable, of, switchMap, map } from 'rxjs';
import { UserInterface } from '../interfaces/user-interface';

@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(
        private auth: AngularFireAuth,
        private firestore: AngularFirestore,
        private router: Router
    ) {}

    //cadastro
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
        return this.firestore.collection('users').doc(id).set(user);
    }

    private isCorporateEmail(email: string): boolean {
        return email.trim().toLowerCase().endsWith('@asimovjr.com.br');
    }

    // login
    async login(email: string, password: string) {
        const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (!user?.emailVerified) {
            await this.auth.signOut();
            throw new Error('E-mail ainda não verificado. Confira sua caixa de entrada.');
        }

        this.router.navigate(['/home']);
    }

    //login com google (apenas para e-mails já cadastrados)
    async loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await this.auth.signInWithPopup(provider);
        const user = userCredential.user;

        if (!user) {
            throw new Error('Não foi possível autenticar com o Google.');
        }

        const doc = await this.firestore.collection('users').doc(user.uid).get().toPromise();

        if (!doc?.exists) {
            //email nao estava previamente cadastrado -> bloqueia acesso
            await this.auth.signOut();
            throw new Error('E-mail não cadastrado. Realize o cadastro antes de entrar com o Google.');
        }

        this.router.navigate(['/home']);
    }

    //recuperar senha(link nativo do Firebase)
    async redefinirSenha(email: string) {
        await this.auth.sendPasswordResetEmail(email);
    }

    //logout
    async logout() {
        await this.auth.signOut();
        this.router.navigate(['/login']);
    }

    //dados do usuário logado
    getUserData(): Observable<UserInterface | null> {
        return this.auth.authState.pipe(
            switchMap(user => {
                if (user) {
                    return this.firestore.collection<UserInterface>('users').doc(user.uid).valueChanges().pipe(
                        map(data => data ?? null)
                    );
                } else {
                    return of(null);
                }
            })
        );
    }
}