import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Subscription
} from 'rxjs';

import {
  Membro,
  Role,
  ROLES_NIVEL_DIRETORIA,
  ROLES_NIVEL_GERENCIA
} from '../../shared/interfaces/membro-interface';

import {
  MembrosService
} from '../../shared/services/membros.service';

import {
  AuthService
} from '../../shared/services/auth';


@Component({
  selector: 'app-gestao-pessoas',
  standalone: false,
  templateUrl: './gestao-pessoas.html',
  styleUrls: ['./gestao-pessoas.scss'],
})
export class GestaoPessoas
  implements OnInit, OnDestroy {

  membros: Membro[] = [];

  private membrosOriginais:
    Membro[] = [];

  private membrosSub?:
    Subscription;


  termoBusca = '';

  carregando = false;


  private rolesComPermissaoEdicao:
    Role[] = [

      ...ROLES_NIVEL_GERENCIA,

      ...ROLES_NIVEL_DIRETORIA,

      'Administrador'

    ];


  podeEditar = false;


  membroEmEdicaoId:
    string | null = null;

  roleEmEdicao:
    Role = 'Membro';

  areaEmEdicao = '';


  rolesDisponiveis:
    Role[] = [

      'Aguardando atribuição',

      'Membro',

      'RH',

      'Gerência',

      'Vice-Presidência',

      'Diretoria',

      'Presidência',

      'Administrador'

    ];


  constructor(
    private readonly membrosService:
      MembrosService,

    private readonly authService:
      AuthService,

    private readonly cdr:
      ChangeDetectorRef
  ) {}


  ngOnInit(): void {

    this.authService
      .getUserData()
      .subscribe(usuario => {

        this.podeEditar =
          !!usuario &&
          this.rolesComPermissaoEdicao
            .includes(
              usuario.role
            );


        //atualiza permissoes na tela
        this.cdr.detectChanges();
      });


    this.carregarMembros();
  }


  //carrega todos os membros
  carregarMembros(): void {

    this.carregando = true;

    this.cdr.detectChanges();


    this.membrosSub =
      this.membrosService
        .listar()
        .subscribe({

          next: membros => {

            this.membrosOriginais =
              membros;


            this.membros =
              this.filtrarLocalmente(
                this.termoBusca
              );


            this.carregando = false;


            //faz os membros aparecerem assim que chegam
            this.cdr.detectChanges();
          },


          error: erro => {

            console.error(
              'Erro ao carregar membros:',
              erro
            );


            this.carregando = false;

            this.cdr.detectChanges();
          }

        });
  }


  ngOnDestroy(): void {

    this.membrosSub
      ?.unsubscribe();
  }


  //filtra os membros pelo nome
  private filtrarLocalmente(
    termo: string
  ): Membro[] {

    const termoLower =
      termo
        .trim()
        .toLowerCase();


    return termoLower

      ? this.membrosOriginais
          .filter(membro =>
            membro.name
              .toLowerCase()
              .includes(
                termoLower
              )
          )

      : this.membrosOriginais;
  }


  //aplica a pesquisa
  pesquisar(): void {

    this.membros =
      this.filtrarLocalmente(
        this.termoBusca
      );
  }


  //abre a edicao
  editarMembro(
    membro: Membro
  ): void {

    if (!this.podeEditar) {
      return;
    }


    this.membroEmEdicaoId =
      membro.id;


    this.roleEmEdicao =
      membro.role;


    this.areaEmEdicao =
      membro.area ?? '';
  }


  //cancela a edicao
  cancelarEdicao(): void {

    this.membroEmEdicaoId =
      null;
  }


  //salva cargo e area
  async salvarEdicao(
    membro: Membro
  ): Promise<void> {

    if (!this.podeEditar) {
      return;
    }


    const novaArea =
      this.areaEmEdicao
        .trim();


    try {

      await this.membrosService
        .atualizarDados(
          membro.id,
          {

            role:
              this.roleEmEdicao,

            area:
              novaArea ||
              undefined

          }
        );


      membro.role =
        this.roleEmEdicao;


      membro.area =
        novaArea ||
        undefined;


      this.membroEmEdicaoId =
        null;


    } catch (erro) {

      console.error(
        'Erro ao atualizar membro:',
        erro
      );


    } finally {

      this.cdr.detectChanges();
    }
  }


  //alterna entre ativo e inativo
  async alternarStatus(
    membro: Membro
  ): Promise<void> {

    if (
      !this.podeEditar ||
      this.membroEmEdicaoId !==
        membro.id
    ) {
      return;
    }


    const novoStatus:
      Membro['status'] =

      this.statusEfetivo(
        membro
      ) === 'Ativo'

        ? 'Inativo'

        : 'Ativo';


    try {

      await this.membrosService
        .atualizarStatus(
          membro.id,
          novoStatus
        );


      membro.status =
        novoStatus;


    } catch (erro) {

      console.error(
        'Erro ao alterar status:',
        erro
      );


    } finally {

      this.cdr.detectChanges();
    }
  }


  //soft delete: apenas marca como inativo
  async removerMembro(
    membro: Membro
  ): Promise<void> {

    if (!this.podeEditar) {
      return;
    }


    if (
      this.statusEfetivo(
        membro
      ) === 'Inativo'
    ) {
      return;
    }


    if (
      !confirm(
        `Desativar ${membro.name}? Ele deixará de aparecer como membro ativo.`
      )
    ) {
      return;
    }


    try {

      await this.membrosService
        .atualizarStatus(
          membro.id,
          'Inativo'
        );


      membro.status =
        'Inativo';


    } catch (erro) {

      console.error(
        'Erro ao desativar membro:',
        erro
      );


    } finally {

      this.cdr.detectChanges();
    }
  }


  trackPorId(
    _index: number,
    membro: Membro
  ): string {

    return membro.id;
  }


  corRole(
    role: Role
  ): string {

    if (
      ROLES_NIVEL_DIRETORIA
        .includes(role)
    ) {
      return 'text-yellow-600';
    }


    if (
      ROLES_NIVEL_GERENCIA
        .includes(role)
    ) {
      return 'text-purple-600';
    }


    return 'text-black';
  }


  //usuarios antigos podem nao possuir status
  statusEfetivo(
    membro: Membro
  ): Membro['status'] {

    return membro.status ??
      'Ativo';
  }


  corBarra(
    role: Role
  ): string {

    if (
      ROLES_NIVEL_DIRETORIA
        .includes(role)
    ) {
      return 'bg-yellow-400';
    }


    if (
      ROLES_NIVEL_GERENCIA
        .includes(role)
    ) {
      return 'bg-purple-500';
    }


    return 'bg-blue-500';
  }
}