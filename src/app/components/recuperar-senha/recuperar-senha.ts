import { Component, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';

@Component({
  selector: 'app-recuperar-senha',
  standalone: false,
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.scss'
})
export class RecuperarSenha {

  //codigo de verificacao
  codigo: string[] = ['', '', '', '', '', ''];

  //estados da tela
  isLoading = signal(false);
  isReenviando = signal(false);
  mensagemErro = signal('');

  @ViewChildren('codigoInput')
  codigoInputs!: QueryList<ElementRef<HTMLInputElement>>;


  //controla a digitacao e avanca para o proximo campo
  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;

    //permite apenas numeros
    const valor = input.value.replace(/\D/g, '');

    input.value = valor.slice(-1);
    this.codigo[index] = input.value;

    this.mensagemErro.set('');

    if (input.value && index < this.codigo.length - 1) {
      this.codigoInputs.get(index + 1)?.nativeElement.focus();
    }
  }


  //volta para o campo anterior ao apagar
  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      this.codigoInputs.get(index - 1)?.nativeElement.focus();
    }
  }


  //permite colar o codigo completo
  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const codigoColado = event.clipboardData
      ?.getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!codigoColado) {
      return;
    }

    const digitos = codigoColado.split('');

    this.codigo = ['', '', '', '', '', ''];

    digitos.forEach((digito, index) => {
      this.codigo[index] = digito;
    });

    this.mensagemErro.set('');

    setTimeout(() => {
      const inputs = this.codigoInputs.toArray();

      inputs.forEach((input, index) => {
        input.nativeElement.value = this.codigo[index];
      });

      const ultimoCampo = Math.min(digitos.length, 6) - 1;

      if (ultimoCampo >= 0) {
        inputs[ultimoCampo]?.nativeElement.focus();
      }
    });
  }


  //retorna o codigo completo
  get codigoCompleto(): string {
    return this.codigo.join('');
  }


  //verifica se todos os campos foram preenchidos
  get codigoValido(): boolean {
    return this.codigoCompleto.length === 6;
  }


  //valida o codigo informado
  validarCodigo() {
    if (!this.codigoValido) {
      this.mensagemErro.set('Preencha todos os campos do código.');
      return;
    }

    //integracao com o backend sera adicionada posteriormente
  }


  //prepara a tela para o reenvio do codigo
  reenviarCodigo() {
    this.codigo = ['', '', '', '', '', ''];
    this.mensagemErro.set('');

    //aguarda a atualizacao dos campos antes de alterar o foco
    setTimeout(() => {
      const inputs = this.codigoInputs.toArray();

      inputs.forEach(input => {
        input.nativeElement.value = '';
      });

      inputs[0]?.nativeElement.focus();
    });

    //integracao com o backend sera adicionada posteriormente
  }

}