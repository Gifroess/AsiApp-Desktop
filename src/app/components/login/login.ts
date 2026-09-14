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



  // Valida somente a parte antes do domínio.
  usuarioEmailValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const valor =
      String(control.value ?? '').trim();


    if (!valor) {
      return null;
    }


    const usuario =
      this.extrairUsuarioEmail(valor);


    const formatoValido =
      /^[a-zA-Z0-9._-]+$/.test(usuario);


    return formatoValido
      ? null
      : {
          usuarioEmailInvalido: true
        };

  }



  // Aceita tanto "usuario" quanto "usuario@asimovjr.com.br".
  private extrairUsuarioEmail(
    valor: string
  ): string {

    return valor
      .trim()
      .toLowerCase()
      .split('@')[0];

  }



  get usuarioEmailDigitado(): string {

    const valor =
      String(
        this.loginForm.get('email')?.value ?? ''
      );


    return this.extrairUsuarioEmail(valor);

  }



  // Monta o e-mail completo antes de enviar ao Firebase.
  private montarEmailCorporativo(): string {

    const valor =
      String(
        this.loginForm.get('email')?.value ?? ''
      );


    const usuario =
      this.extrairUsuarioEmail(valor);


    return `${usuario}${this.dominioEmail}`;

  }



  // Define o tamanho visual do campo antes do domínio fixo.
  larguraUsuarioEmail(): number {

    const valor =
      String(
        this.loginForm.get('email')?.value ?? ''
      );


    const usuario =
      this.extrairUsuarioEmail(valor);


    const caracteres =
      Math.max(usuario.length, 8);


    return Math.min(
      caracteres + 1,
      18
    );

  }



  // Envia o e-mail preenchido para recuperação de senha.
  abrirRecuperacaoSenha(): void {

    const emailControl =
      this.loginForm.get('email');


    emailControl?.markAsTouched();


    if (
      !emailControl ||
      emailControl.invalid
    ) {
      return;
    }


    const email =
      this.montarEmailCorporativo();


    this.router.navigate(
      ['/recuperar-senha'],
      {
        state: {
          email
        }
      }
    );

  }



  async onSubmit(): Promise<void> {

    this.authErrorMessage = '';


    if (
      this.loginForm.invalid
    ) {

      this.loginForm.markAllAsTouched();

      return;

    }


    const email =
      this.montarEmailCorporativo();


    const senha =
      this.loginForm.get('senha')?.value;


    this.isLoading = true;


    try {

      await this.authService.login(
        email,
        senha
      );


    } catch(error) {

      this.authErrorMessage =
        this.traduzErroFirebase(error);


    } finally {

      this.isLoading = false;

    }

  }



  // Login utilizando Google.
  async loginWithGoogle(): Promise<void> {

    this.isLoading = true;

    this.authErrorMessage = '';


    try {

      await this.authService.loginWithGoogle();


    } catch(error: any) {


      console.log(
        'Erro Google Login:',
        error
      );


      // Fechar o popup não é um erro real.
      if (
        error?.code !== 'auth/popup-closed-by-user' &&
        error?.code !== 'auth/cancelled-popup-request'
      ) {

        this.authErrorMessage =
          this.traduzErroFirebase(error);

      }


    } finally {

      // Sempre libera os botões após finalizar.
      this.isLoading = false;

    }

  }



  // Traduz erros do Firebase para mensagens amigáveis.
  private traduzErroFirebase(
    error: any
  ): string {

    const codigo =
      error?.code;


    switch(codigo) {


      case 'auth/invalid-email':
        return 'E-mail inválido.';


      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'E-mail ou senha incorretos.';


      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente em alguns minutos.';


      case 'auth/popup-closed-by-user':
        return '';


      case 'auth/popup-blocked':
        return 'O navegador bloqueou a janela de login com Google.';


      case 'auth/cancelled-popup-request':
        return '';


      case 'auth/account-exists-with-different-credential':
        return 'Este e-mail já está vinculado a outra forma de login.';


      case 'auth/unauthorized-domain':
        return 'Este endereço não está autorizado para login com Google.';


      case 'auth/network-request-failed':
        return 'Não foi possível conectar ao Firebase. Verifique sua conexão.';


      default:
        return error?.message ||
          'Não foi possível entrar. Tente novamente.';

    }

  }

}