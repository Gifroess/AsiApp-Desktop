import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-cadastro',
  standalone: false,
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss'
})
export class Cadastro {

  cadastroForm: FormGroup;
  //trocados de propriedades comuns para signals: o app roda em modo zoneless (sem zone.js),
  //entao mudancas feitas dentro de callbacks assincronos (apos um await do firebase) so
  //atualizam a tela se forem signals
  isLoading = signal(false);
  authErrorMessage = signal('');
  cadastroConcluido = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    //estrutura e regras de validacao do formulario de cadastro
    this.cadastroForm = this.fb.group({
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email, this.corporateEmailValidator]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.senhasIguaisValidator });
  }

  //validacao que garante que o cadastro seja feito apenas com email @asimovjr.com.br
  corporateEmailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value as string;
    if (!email) return null;

    const dominioValido = email.trim().toLowerCase().endsWith('@asimovjr.com.br');
    return dominioValido ? null : { corporateEmail: true };
  }

  //validador de grupo: compara os campos senha e confirmarSenha
  //precisa ficar no nivel do FormGroup (e nao de um Control isolado) porque so assim ele tem acesso aos dois campos ao mesmo tempo pra poder comparar
  private senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
    const senha = group.get('senha')?.value;
    const confirmarSenhaControl = group.get('confirmarSenha');
    const confirmarSenha = confirmarSenhaControl?.value;

    if (!confirmarSenhaControl) return null;

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      confirmarSenhaControl.setErrors({ ...confirmarSenhaControl.errors, senhasDiferentes: true });
    } else if (confirmarSenhaControl.hasError('senhasDiferentes')) {
      const { senhasDiferentes, ...outrosErros } = confirmarSenhaControl.errors ?? {};
      confirmarSenhaControl.setErrors(Object.keys(outrosErros).length ? outrosErros : null);
    }

    return null;
  }

   //cria a conta no Firebase via AuthService e trata o retorno (sucesso ou erro)
  async onSubmit(): Promise<void> {
    this.authErrorMessage.set('');

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    const { nome, email, senha, confirmarSenha } = this.cadastroForm.value;
    this.isLoading.set(true);

    try {
      //corrida entre o cadastro de verdade e um timer: se o firebase nao responder
      //dentro do prazo, a gente libera a tela em vez de deixar o usuario preso olhando pro loading
      await this.comTimeout(
        this.authService.cadastro(nome, email, senha, confirmarSenha),
        15000
      );

      //o AuthService ja desloga o usuario e dispara o email de verificacao apos criar a conta
      //entao aqui so avisamos na tela e mandamos pra tela de verificacao depois de alguns segundos
      this.cadastroConcluido.set(true);
      this.cadastroForm.reset();

      setTimeout(() => this.router.navigate(['/verificar-email'], { queryParams: { email } }), 3000);
    } catch (error) {
      this.authErrorMessage.set(this.traduzErroFirebase(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  //envolve uma promise qualquer com um limite de tempo
  //importante: isso nao cancela a operacao original no firebase, so impede que a TELA fique presa esperando.
  //ou seja, em caso de timeout, e possivel que o cadastro termine de qualquer forma alguns segundos depois em segundo plano
  private comTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject({ code: 'custom/timeout' }), ms)
    );

    return Promise.race([promise, timeout]);
  }

  //converte os codigos de erro do firebase (e os erros lancados pelo proprio AuthService) em mensagens para o usuario
  private traduzErroFirebase(error: any): string {
    const codigo = error?.code;

    switch (codigo) {
      case 'auth/email-already-in-use':
        return 'Esse e-mail já possui cadastro. Faça login ou recupere sua senha.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/weak-password':
        return 'Senha muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/network-request-failed':
        return 'Falha de conexão. Verifique sua internet e tente novamente.';
      case 'custom/timeout':
        return 'O servidor demorou muito para responder. Verifique sua internet e tente novamente em instantes.';
      default:
        //erros lancados pelo proprio AuthService ja vem com mensagem pronta
        return error?.message ?? 'Não foi possível concluir o cadastro. Tente novamente.';
    }
  }
}