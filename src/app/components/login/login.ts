import { Component } from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

import { AuthService } from '../../shared/services/auth';


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
    private authService: AuthService
  ) {

    //estrutura e validações do formulário de login
    this.loginForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          this.corporateEmailValidator
        ]
      ],

      senha: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]
    });
  }


  //valida o domínio corporativo da Asimov
  corporateEmailValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const email = control.value as string;

    if (!email) {
      return null;
    }

    const dominioValido = email
      .trim()
      .toLowerCase()
      .endsWith('@asimovjr.com.br');

    return dominioValido
      ? null
      : { corporateEmail: true };
  }


  //realiza o login com e-mail e senha
  async onSubmit(): Promise<void> {

    this.authErrorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const {
      email,
      senha
    } = this.loginForm.value;

    this.isLoading = true;

    try {

      await this.authService.login(
        email,
        senha
      );

      //o redirecionamento é feito pelo AuthService

    } catch (error) {

      this.authErrorMessage =
        this.traduzErroFirebase(error);

    } finally {

      this.isLoading = false;
    }
  }


  //realiza o login utilizando uma conta google
  async loginWithGoogle(): Promise<void> {

    this.authErrorMessage = '';
    this.isLoading = true;

    try {

      await this.authService.loginWithGoogle();

      //o redirecionamento é feito pelo AuthService

    } catch (error) {

      this.authErrorMessage =
        this.traduzErroFirebase(error);

    } finally {

      this.isLoading = false;
    }
  }


  //transforma os erros do firebase em mensagens mais claras
  private traduzErroFirebase(
    error: any
  ): string {

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

      case 'auth/popup-blocked':
        return 'O navegador bloqueou a janela de login com Google.';

      case 'auth/account-exists-with-different-credential':
        return 'Este e-mail já está vinculado a outra forma de login.';

      case 'auth/network-request-failed':
        return 'Não foi possível conectar ao Firebase. Verifique sua conexão.';

      default:
        return error?.message ||
          'Não foi possível entrar. Tente novamente.';
    }
  }
}