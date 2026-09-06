import { Component, OnInit } from '@angular/core';
import { Membro, Role, ROLES_NIVEL_DIRETORIA, ROLES_NIVEL_GERENCIA } from '../../shared/interfaces/membro-interface';
import { MembrosService } from '../../shared/services/membros.service';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-gestao-pessoas',
  standalone: false,
  templateUrl: './gestao-pessoas.html',
  styleUrls: ['./gestao-pessoas.scss'],
})
export class GestaoPessoas implements OnInit {
  membros: Membro[] = [];
  termoBusca = '';
  carregando = false;


  private rolesComPermissaoEdicao: Role[] = [
    ...ROLES_NIVEL_GERENCIA,
    ...ROLES_NIVEL_DIRETORIA,
    'Administrador',
  ];

  podeEditar = false;

  membroEmEdicaoId: string | null = null;
  roleEmEdicao: Role = 'Membro';
  areaEmEdicao = '';

  rolesDisponiveis: Role[] = [
    'Aguardando atribuição',
    'Membro',
    'Gerência',
    'Vice-Presidência',
    'Diretoria',
    'Presidência',
    'Administrador',
  ];

  constructor(
    private readonly membrosService: MembrosService,
    private readonly authService: AuthService
  ) {}

  // TOGGLE PRA TESTE DE FRONT: true = ignora o login real e força podeEditar=true,
  private readonly FORCAR_PODE_EDITAR_PARA_TESTE = true;

  ngOnInit(): void {
    if (this.FORCAR_PODE_EDITAR_PARA_TESTE) {
      this.podeEditar = true;
    } else {

      this.authService.getUserData().subscribe((usuario) => {
        this.podeEditar = !!usuario && this.rolesComPermissaoEdicao.includes(usuario.role);
      });
    }

    this.carregarMembros();
  }

  carregarMembros(): void {
    this.carregando = true;
    this.membrosService.listar().subscribe((membros) => {
      this.membros = membros;
      this.carregando = false;
    });
  }

  pesquisar(): void {
    this.carregando = true;
    this.membrosService.buscarPorNome(this.termoBusca).subscribe((membros) => {
      this.membros = membros;
      this.carregando = false;
    });
  }


  editarMembro(membro: Membro): void {
    if (!this.podeEditar) return;
    this.membroEmEdicaoId = membro.id;
    this.roleEmEdicao = membro.role;
    this.areaEmEdicao = membro.area ?? '';
  }

  cancelarEdicao(): void {
    this.membroEmEdicaoId = null;
  }

  async salvarEdicao(membro: Membro): Promise<void> {
    if (!this.podeEditar) return;
    const novaArea = this.areaEmEdicao.trim();

    await this.membrosService.atualizarDados(membro.id, {
      role: this.roleEmEdicao,
      area: novaArea || undefined,
    });

    membro.role = this.roleEmEdicao;
    membro.area = novaArea || undefined;
    this.membroEmEdicaoId = null;
  }

  async alternarStatus(membro: Membro): Promise<void> {
    if (!this.podeEditar || this.membroEmEdicaoId !== membro.id) return;
    const novoStatus: Membro['status'] = membro.status === 'Ativo' ? 'Inativo' : 'Ativo';
    await this.membrosService.atualizarStatus(membro.id, novoStatus);
    membro.status = novoStatus;
  }

  // "Excluir" na UI = soft delete: só marca o membro como Inativo, sem apagar
  // o documento do Firestore (para não perder histórico de dados, como quem fez login, etc).
  async removerMembro(membro: Membro): Promise<void> {
    if (!this.podeEditar) return;
    if (membro.status === 'Inativo') return; // já está inativo, nada a fazer
    if (!confirm(`Desativar ${membro.name}? Ele deixará de aparecer como membro ativo.`)) return;

    await this.membrosService.atualizarStatus(membro.id, 'Inativo');
    membro.status = 'Inativo';
  }

  corRole(role: Role): string {
    if (ROLES_NIVEL_DIRETORIA.includes(role)) return 'text-yellow-600';
    if (ROLES_NIVEL_GERENCIA.includes(role)) return 'text-purple-600';
    return 'text-black';
  }


  corBarra(role: Role): string {
    if (ROLES_NIVEL_DIRETORIA.includes(role)) return 'bg-yellow-400';
    if (ROLES_NIVEL_GERENCIA.includes(role)) return 'bg-purple-500';
    return 'bg-blue-500';
  }
}