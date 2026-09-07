import {
  Component,
  signal
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

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

  //signals utilizados porque o projeto roda em modo zoneless
  isLoading = signal(false);
  authErrorMessage = signal('');
  cadastroConcluido = signal(false);


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    //estrutura e validações do formulário de cadastro
    this.cadastroForm = this.fb.group(
      {
        nome: [
          '',
          [
            Validators.required,
            Validators.minLength(2)
          ]
        ],

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
        ],

        confirmarSenha: [
          '',
          Validators.required
        ]
      },
      {
        validators: this.senhasIguaisValidator
      }
    );
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


  //compara os campos de senha e confirmação
  private senhasIguaisValidator(
    group: AbstractControl
  ): ValidationErrors | null {

    const senha = group.get('senha')?.value;

    const confirmarSenhaControl =
      group.get('confirmarSenha');

    const confirmarSenha =
      confirmarSenhaControl?.value;


    if (!confirmarSenhaControl) {
      return null;
    }


    if (
      senha &&
      confirmarSenha &&
      senha !== confirmarSenha
    ) {

      confirmarSenhaControl.setErrors({
        ...confirmarSenhaControl.errors,
        senhasDiferentes: true
      });

    } else if (
      confirmarSenhaControl.hasError('senhasDiferentes')
    ) {

      const {
        senhasDiferentes,
        ...outrosErros
      } = confirmarSenhaControl.errors ?? {};

      confirmarSenhaControl.setErrors(
        Object.keys(outrosErros).length
          ? outrosErros
          : null
      );
    }

    return null;
  }


  //cria a conta utilizando o AuthService
  async onSubmit(): Promise<void> {

    this.authErrorMessage.set('');
    this.cadastroConcluido.set(false);


    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }


    const {
      nome,
      email,
      senha,
      confirmarSenha
    } = this.cadastroForm.value;


    if (!nome?.trim()) {

      this.authErrorMessage.set(
        'Informe um nome válido.'
      );

      return;
    }


    this.isLoading.set(true);


    try {

      await this.authService.cadastro(
        nome,
        email,
        senha,
        confirmarSenha
      );


      //o AuthService cria o usuário, salva os dados,
      //envia a verificação de e-mail e encerra a sessão
      this.cadastroConcluido.set(true);

      this.cadastroForm.reset();


      //retorna ao login após exibir a confirmação
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000);


    } catch (error) {

      this.authErrorMessage.set(
        this.traduzErroFirebase(error)
      );


    } finally {

      this.isLoading.set(false);
    }
  }


  //transforma os erros do firebase em mensagens mais claras
  private traduzErroFirebase(
    error: any
  ): string {

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

      case 'auth/too-many-requests':
        return 'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.';

      case 'auth/operation-not-allowed':
        return 'O cadastro por e-mail e senha não está disponível no momento.';

      default:
        return error?.message ||
          'Não foi possível concluir o cadastro. Tente novamente.';
    }
  }
}