import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-verificar-email',
  standalone: false,
  templateUrl: './verificar-email.html',
  styleUrl: './verificar-email.scss',
})
export class VerificarEmail {
  form: FormGroup;

  //signals: o app roda zoneless
  isLoading = signal(false);
  mensagemSucesso = signal('');
  mensagemErro = signal('');
  emailAlvo = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    route: ActivatedRoute,
  ) {
    //o e-mail chega por query param quando o usuário é mandado pra cá pelo login/cadastro
    const email = route.snapshot.queryParamMap.get('email') ?? '';
    this.emailAlvo.set(email);

    this.form = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      senha: ['', [Validators.required]],
    });
  }

  async reenviar(): Promise<void> {
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, senha } = this.form.value;
    this.isLoading.set(true);

    try {
      await this.authService.reenviarVerificacao(email, senha);
      this.mensagemSucesso.set(
        'E-mail de verificação reenviado. Confira sua caixa de entrada (e o spam).',
      );
    } catch (error: any) {
      const codigo = error?.code;
      this.mensagemErro.set(
        codigo === 'auth/invalid-credential' ||
          codigo === 'auth/wrong-password' ||
          codigo === 'auth/user-not-found'
          ? 'E-mail ou senha incorretos.'
          : codigo === 'auth/too-many-requests'
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : error?.message ?? 'Não foi possível reenviar o e-mail.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
