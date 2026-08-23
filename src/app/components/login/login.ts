import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // Estrutura e regras de validação do formulário de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.corporateEmailValidator]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  //validador: garante que o login seja feito apenas com e-mail @asimovjr.com.br)
  corporateEmailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value as string;
    if (!email) return null;

    const dominioValido = email.trim().toLowerCase().endsWith('@asimovjr.com.br');
    return dominioValido ? null : { corporateEmail: true };
  }

  //funçao chamada quando submeter o formulario de login
  onSubmit(): void {
    if (this.loginForm.invalid) {
      //marca todos os campos como tocados para exibir mensagens de erro
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, senha } = this.loginForm.value;

    //chamar aqui a autenticação real do Firebase (email/senha)
    console.log('Formulário válido, pronto para autenticar:', { email, senha });
  }

  //funçao chamada ao clicar no botao de login com google
  loginWithGoogle(): void {
    //chamar aqui o signInWithPopup do firebase authentication
    console.log('Login com Google acionado');
  }
}