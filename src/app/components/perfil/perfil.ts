import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  editandoNome = false;
  editandoSenha = false;

  mensagemSucesso = '';
  mensagemErro = '';
  carregando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private storageService: StorageService
  ) {
    this.perfilForm = this.fb.group({
      nome: ['', Validators.required]
    });

    this.senhaForm = this.fb.group({
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.authService.getUserData().subscribe(usuario => {
      this.usuario = usuario;
      if (usuario) {
        this.perfilForm.patchValue({ nome: usuario.name });
      }
    });

    this.authService.getUid().then(uid => {
        if (uid) this.uid = uid;
    });
  }

  toggleSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }


  // async salvarNome(): Promise<void> {
  //   if (this.perfilForm.invalid || !this.uid) return;
  //   this.carregando = true;
  //   try {
  //     await this.usuarioService.atualizarNome(this.uid, this.perfilForm.value.nome);
  //     this.mensagemSucesso = 'Nome atualizado com sucesso!';
  //     this.editandoNome = false;
  //   } catch (error) {
  //     this.mensagemErro = 'Erro ao atualizar nome.';
  //   } finally {
  //     this.carregando = false;
  //   }
  // }

  // async salvarSenha(): Promise<void> {
  //   if (this.senhaForm.invalid) return;
  //   this.carregando = true;
  //   try {
  //     const { senhaAtual, novaSenha } = this.senhaForm.value;
  //     await this.usuarioService.trocarSenha(senhaAtual, novaSenha);
  //     this.mensagemSucesso = 'Senha atualizada com sucesso!';
  //     this.senhaForm.reset();
  //     this.editandoSenha = false;
  //   } catch (error: any) {
  //     this.mensagemErro = error?.code === 'auth/wrong-password'
  //       ? 'Senha atual incorreta.'
  //       : 'Erro ao atualizar senha.';
  //   } finally {
  //     this.carregando = false;
  //   }
  // }
// substitui editandoNome e editandoSenha por um único estado:
modoEdicao = false;

alternarEdicao(): void {
  this.modoEdicao = !this.modoEdicao;
  if (!this.modoEdicao) {
    this.senhaForm.reset(); // limpa campos de senha ao cancelar/fechar edição
  }
}

  async salvarPerfil(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    try {
      // sempre salva o nome, se tiver mudado
      if (this.perfilForm.valid && this.perfilForm.dirty) {
        await this.usuarioService.atualizarNome(this.uid, this.perfilForm.value.nome);
      }

      // só tenta trocar senha se o usuário preencheu os campos
      const { senhaAtual, novaSenha } = this.senhaForm.value;
      if (senhaAtual && novaSenha) {
        if (this.senhaForm.invalid) {
          throw new Error('Preencha a nova senha corretamente (mínimo 6 caracteres).');
        }
        await this.usuarioService.trocarSenha(senhaAtual, novaSenha);
      }

      this.mensagemSucesso = 'Perfil atualizado com sucesso!';
      this.modoEdicao = false;
      this.senhaForm.reset();
    } catch (error: any) {
      this.mensagemErro = error?.code === 'auth/wrong-password'
        ? 'Senha atual incorreta.'
        : (error?.message || 'Erro ao atualizar perfil.');
    } finally {
      this.carregando = false;
    }
  }

  async onFotoSelecionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.uid) return;

    const file = input.files[0];
    this.carregando = true;
    try {
      const url = await this.storageService.uploadFotoPerfil(this.uid, file);
      await this.usuarioService.atualizarFotoUrl(this.uid, url);
      this.mensagemSucesso = 'Foto atualizada!';
    } catch (error) {
      this.mensagemErro = 'Erro ao enviar foto.';
    } finally {
      this.carregando = false;
    }
  }
}