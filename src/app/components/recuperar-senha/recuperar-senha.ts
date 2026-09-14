import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-recuperar-senha',
  standalone: false,
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.scss'
})
export class RecuperarSenha {

  email = '';
  isLoading = signal(false);
  emailEnviado = signal(false);
  mensagemErro = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async enviarEmail(): Promise<void> {
    const email = this.email.trim().toLowerCase();

    this.mensagemErro.set('');

    if (!email) {
      this.mensagemErro.set('Informe seu e-mail.');
      return;
    }

    if (!email.endsWith('@asimovjr.com.br')) {
      this.mensagemErro.set(
        'Utilize seu e-mail corporativo (@asimovjr.com.br).'
      );
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.redefinirSenha(email);
      this.emailEnviado.set(true);
    } catch (erro: any) {
      this.mensagemErro.set(
        this.traduzErroFirebase(erro)
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  voltarLogin(): void {
    this.router.navigate(['/']);
  }

  private traduzErroFirebase(erro: any): string {
    switch (erro?.code) {
      case 'auth/invalid-email':
        return 'O e-mail informado é inválido.';

      case 'auth/user-not-found':
        return 'Não encontramos uma conta cadastrada com este e-mail.';

      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';

      case 'auth/network-request-failed':
        return 'Não foi possível conectar ao Firebase. Verifique sua conexão.';

      default:
        return 'Não foi possível enviar o e-mail de recuperação.';
    }
  }
}