import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { AuthService } from '../../shared/services/auth';
import { UsuarioService } from '../../shared/services/usuario.service';
import { StorageService } from '../../shared/services/storage.service';

import { UserInterface } from '../../shared/interfaces/user-interface';


@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class Perfil implements OnInit {

  usuario: UserInterface | null = null;

  uid = '';

  perfilForm: FormGroup;
  senhaForm: FormGroup;

  mostrarSenha = false;
  modoEdicao = false;

  mensagemSucesso = '';
  mensagemErro = '';

  carregando = false;


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef
  ) {

    this.perfilForm =
      this.fb.group({

        nome: [
          '',
          Validators.required
        ]

      });


    this.senhaForm =
      this.fb.group({

        senhaAtual: [
          '',
          Validators.required
        ],

        novaSenha: [
          '',
          [
            Validators.required,
            Validators.minLength(6)
          ]
        ]

      });
  }


  ngOnInit(): void {

    //carrega os dados do usuario logado
    this.authService
      .getUserData()
      .subscribe(usuario => {

        this.usuario = usuario;


        if (usuario) {

          this.perfilForm
            .patchValue({
              nome: usuario.name
            });


          this.perfilForm
            .markAsPristine();
        }


        //atualiza a tela no modo zoneless
        this.cdr.detectChanges();
      });


    //busca o uid do usuario autenticado
    this.authService
      .getUid()
      .then(uid => {

        if (uid) {
          this.uid = uid;
        }


        this.cdr.detectChanges();
      });
  }


  //exibe ou oculta a senha
  toggleSenha(): void {

    this.mostrarSenha =
      !this.mostrarSenha;
  }


  //ativa ou cancela a edicao
  alternarEdicao(): void {

    this.modoEdicao =
      !this.modoEdicao;


    this.mensagemErro = '';
    this.mensagemSucesso = '';


    //ao cancelar desfaz alteracoes locais
    if (!this.modoEdicao) {

      this.perfilForm
        .patchValue({
          nome:
            this.usuario?.name || ''
        });


      this.perfilForm
        .markAsPristine();


      this.senhaForm.reset();

      this.mostrarSenha = false;
    }
  }


  //salva as alteracoes do perfil
  async salvarPerfil():
    Promise<void> {

    if (!this.uid) {

      this.mensagemErro =
        'Usuário não autenticado.';

      return;
    }


    this.carregando = true;

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.cdr.detectChanges();


    try {

      //atualiza o nome somente se foi alterado
      if (
        this.perfilForm.dirty
      ) {

        if (
          this.perfilForm.invalid
        ) {

          throw new Error(
            'Informe um nome válido.'
          );
        }


        const novoNome =
          this.perfilForm
            .value
            .nome
            .trim();


        await this.usuarioService
          .atualizarNome(
            this.uid,
            novoNome
          );


        //atualiza localmente sem esperar nova renderizacao
        if (this.usuario) {

          this.usuario = {
            ...this.usuario,
            name: novoNome
          };
        }


        this.perfilForm
          .markAsPristine();
      }


      const {
        senhaAtual,
        novaSenha
      } =
        this.senhaForm.value;


      //se uma senha for preenchida as duas sao obrigatorias
      if (
        senhaAtual ||
        novaSenha
      ) {

        if (
          !senhaAtual ||
          !novaSenha
        ) {

          throw new Error(
            'Preencha a senha atual e a nova senha.'
          );
        }


        if (
          this.senhaForm.invalid
        ) {

          throw new Error(
            'A nova senha deve possuir pelo menos 6 caracteres.'
          );
        }


        await this.usuarioService
          .trocarSenha(
            senhaAtual,
            novaSenha
          );
      }


      this.mensagemSucesso =
        'Perfil atualizado com sucesso!';


      this.modoEdicao = false;

      this.senhaForm.reset();

      this.mostrarSenha = false;


    } catch (error: any) {

      if (
        error?.code ===
          'auth/wrong-password' ||
        error?.code ===
          'auth/invalid-credential'
      ) {

        this.mensagemErro =
          'Senha atual incorreta.';

      } else {

        this.mensagemErro =
          error?.message ||
          'Erro ao atualizar perfil.';
      }


    } finally {

      this.carregando = false;

      //garante a atualizacao visual
      this.cdr.detectChanges();
    }
  }


  //envia uma nova foto
  async onFotoSelecionada(
    event: Event
  ): Promise<void> {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files?.length
    ) {
      return;
    }


    if (!this.uid) {

      this.mensagemErro =
        'Usuário não autenticado.';

      return;
    }


    const file =
      input.files[0];


    this.carregando = true;

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.cdr.detectChanges();


    try {

      const url =
        await this.storageService
          .uploadFotoPerfil(
            this.uid,
            file
          );


      await this.usuarioService
        .atualizarFotoUrl(
          this.uid,
          url
        );


      //troca a imagem imediatamente na tela
      if (this.usuario) {

        this.usuario = {
          ...this.usuario,
          photoUrl: url
        };
      }


      this.mensagemSucesso =
        'Foto atualizada com sucesso!';


    } catch (error) {

      console.error(
        'Erro ao enviar foto:',
        error
      );


      this.mensagemErro =
        'Erro ao enviar foto.';


    } finally {

      this.carregando = false;


      //permite selecionar o mesmo arquivo novamente
      input.value = '';


      //atualiza foto, botao e mensagens imediatamente
      this.cdr.detectChanges();
    }
  }
}