import { Component } from '@angular/core';
import { Router } from '@angular/router';
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

  readonly dominioEmail = '@asimovjr.com.br';

  loginForm: FormGroup;
  isLoading = false;
  authErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          this.usuarioEmailValidator
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

  //valida apenas a parte do usuario antes do dominio
  usuarioEmailValidator(control: AbstractControl): ValidationErrors | null {
    const valor = String(control.value ?? '').trim();

    if (!valor) {
      return null;
    }

    const usuario = this.extrairUsuarioEmail(valor);
    const formatoValido = /^[a-zA-Z0-9._-]+$/.test(usuario);

    return formatoValido
      ? null
      : { usuarioEmailInvalido: true };
  }

  //aceita tanto usuario puro quanto email completo colado no campo
  private extrairUsuarioEmail(valor: string): string {
    return valor
      .trim()
      .toLowerCase()
      .split('@')[0];
  }

  get usuarioEmailDigitado(): string {
    const valor = String(this.loginForm.get('email')?.value ?? '');
    return this.extrairUsuarioEmail(valor);
  }

  private montarEmailCorporativo(): string {
    const valor = String(this.loginForm.get('email')?.value ?? '');
    const usuario = this.extrairUsuarioEmail(valor);

    return `${usuario}${this.dominioEmail}`;
  }

  //define a largura visual da primeira parte do email
  larguraUsuarioEmail(): number {
    const valor = String(this.loginForm.get('email')?.value ?? '');
    const usuario = this.extrairUsuarioEmail(valor);

    const caracteres = Math.max(usuario.length, 8);

    return Math.min(caracteres + 1, 18);
  }

  //leva o email completo para a recuperacao de senha
  abrirRecuperacaoSenha(): void {
    const emailControl = this.loginForm.get('email');

    emailControl?.markAsTouched();

    if (!emailControl || emailControl.invalid) {
      return;
    }

    const email = this.montarEmailCorporativo();

    this.router.navigate(
      ['/recuperar-senha'],
      {
        state: { email }
      }
    );
  }

  async onSubmit(): Promise<void> {
    this.authErrorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.montarEmailCorporativo();
    const senha = this.loginForm.get('senha')?.value;

    this.isLoading = true;

    try {
      await this.authService.login(email, senha);
    } catch (error) {
      this.authErrorMessage = this.traduzErroFirebase(error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.authErrorMessage = '';
    this.isLoading = true;

    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      this.authErrorMessage = this.traduzErroFirebase(error);
    } finally {
      this.isLoading = false;
    }
  }

  //transforma os erros do firebase em mensagens mais claras
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