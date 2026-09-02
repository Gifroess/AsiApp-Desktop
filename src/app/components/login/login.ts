import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  loginForm: FormGroup;
  //signals: o app roda zoneless, mudanças feitas após um await do firebase
  //só atualizam a tela se forem signals (mesmo padrão do cadastro)
  isLoading = signal(false);
  authErrorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
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

  //autentica o usuario com email e senha via AuthService (mantém a validacao de e-mail verificado)
  async onSubmit(): Promise<void> {
    this.authErrorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, senha } = this.loginForm.value;
    this.isLoading.set(true);

    try {
      await this.authService.login(email, senha);
      //o proprio AuthService redireciona: /home se verificado, /verificar-email se nao
    } catch (error) {
      this.authErrorMessage.set(this.traduzErroFirebase(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  //autentica o usuario via popup de login do google (AuthService bloqueia quem nao tem cadastro)
  async loginWithGoogle(): Promise<void> {
    this.authErrorMessage.set('');
    this.isLoading.set(true);

    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      this.authErrorMessage.set(this.traduzErroFirebase(error));
    } finally {
      this.isLoading.set(false);
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
        //erros lançados pelo AuthService (email nao verificado, conta nao cadastrada) ja vem com mensagem pronta
        return error?.message ?? 'Não foi possível entrar. Tente novamente.';
    }
  }
}