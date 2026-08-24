import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-cadastro',
  standalone: false,
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss'
})
export class Cadastro {

  cadastroForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder) {
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

    //joga o erro direto no controle de confirmarSenha (em vez de deixar so no grupo)
    //assim a mensagem aparece embaixo do campo certo, do mesmo jeito que os outros erros do form
    if (senha && confirmarSenha && senha !== confirmarSenha) {
      //preserva outros erros que o campo ja tenha (ex: required) e so acrescenta o novo
      confirmarSenhaControl.setErrors({ ...confirmarSenhaControl.errors, senhasDiferentes: true });
    } else if (confirmarSenhaControl.hasError('senhasDiferentes')) {
      //senhas voltaram a bater -> remove so esse erro, sem mexer nos demais (ex: required)
      const { senhasDiferentes, ...outrosErros } = confirmarSenhaControl.errors ?? {};
      confirmarSenhaControl.setErrors(Object.keys(outrosErros).length ? outrosErros : null);
    }

    return null;
  }

  //valida o formulario inteiro, a chamada ao AuthService.cadastro() entra na prox etapa
  onSubmit(): void {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    //prox etapa -> chamar this.authService.cadastro(...) com os valores do form
  }
}