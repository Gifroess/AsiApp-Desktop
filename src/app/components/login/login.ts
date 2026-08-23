import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  loginForm: FormGroup;
  isLoading = false;
  authErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
    //estrutura e regras de validacao do formulário de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.corporateEmailValidator]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  //validacao que garante que o login seja feito apenas com email @asimovjr.com.br
  corporateEmailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value as string;
    if (!email) return null;

    const dominioValido = email.trim().toLowerCase().endsWith('@asimovjr.com.br');
    return dominioValido ? null : { corporateEmail: true };
  }

  //autentica o usuario com email e senha no firebase authentication
  async onSubmit(): Promise<void> {
    this.authErrorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, senha } = this.loginForm.value;
    this.isLoading = true;

    try {
      await this.afAuth.signInWithEmailAndPassword(email, senha);
      //assim que a tela Home estiver pronta no repositorio, confirmar se essa rota bate certinho
      this.router.navigateByUrl('/home');
    } catch (error) {
      this.authErrorMessage = this.traduzErroFirebase(error);
    } finally {
      this.isLoading = false;
    }
  }

  //autentica o usuario via popup de login do google
  async loginWithGoogle(): Promise<void> {
    this.authErrorMessage = '';
    this.isLoading = true;

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await this.afAuth.signInWithPopup(provider);
      //assim que a tela Home estiver pronta no repositorio, confirmar se essa rota bate certinho
      this.router.navigateByUrl('/home');
    } catch (error) {
      this.authErrorMessage = this.traduzErroFirebase(error);
    } finally {
      this.isLoading = false;
    }
  }

  //converte os codigos de erro do firebase em mensagens para o usuario
  private traduzErroFirebase(error: any): string {
    const codigo = error?.code;

    switch (codigo) {
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'E-mail ou senha incorretos.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente em alguns minutos.';
      case 'auth/popup-closed-by-user':
        return 'Login com Google cancelado.';
      default:
        return 'Não foi possível entrar. Tente novamente.';
    }
  }
}