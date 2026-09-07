import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Membro, Role, ROLES_NIVEL_DIRETORIA, ROLES_NIVEL_GERENCIA } from '../../shared/interfaces/membro-interface';
import { MembrosService } from '../../shared/services/membros.service';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-gestao-pessoas',
  standalone: false, 
  templateUrl: './gestao-pessoas.html',
  styleUrls: ['./gestao-pessoas.scss'],
})
export class GestaoPessoas implements OnInit, OnDestroy {
  membros: Membro[] = [];

  private membrosOriginais: Membro[] = [];
  private membrosSub?: Subscription;

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
    'RH',
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

  ngOnInit(): void {

    this.authService.getUserData().subscribe((usuario) => {
      this.podeEditar = !!usuario && this.rolesComPermissaoEdicao.includes(usuario.role);
    });

    this.carregarMembros();
  }

  carregarMembros(): void {
    this.carregando = true;

    this.membrosSub = this.membrosService.listar().subscribe((membros) => {
      this.membrosOriginais = membros;
      this.membros = this.filtrarLocalmente(this.termoBusca);
      this.carregando = false;
    });
  }

  ngOnDestroy(): void {
    this.membrosSub?.unsubscribe();
  }

  private filtrarLocalmente(termo: string): Membro[] {
    const termoLower = termo.trim().toLowerCase();
    return termoLower
      ? this.membrosOriginais.filter((m) => m.name.toLowerCase().includes(termoLower))
      : this.membrosOriginais;
  }

  pesquisar(): void {
    this.membros = this.filtrarLocalmente(this.termoBusca);
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
    const novoStatus: Membro['status'] = this.statusEfetivo(membro) === 'Ativo' ? 'Inativo' : 'Ativo';
    await this.membrosService.atualizarStatus(membro.id, novoStatus);
    membro.status = novoStatus;
  }

  //soft delete: só marca o membro como Inativo, sem apagar
  // o documento do Firestore 
  async removerMembro(membro: Membro): Promise<void> {
    if (!this.podeEditar) return;
    if (this.statusEfetivo(membro) === 'Inativo') return; // já está inativo, nada a fazer
    if (!confirm(`Desativar ${membro.name}? Ele deixará de aparecer como membro ativo.`)) return;

    await this.membrosService.atualizarStatus(membro.id, 'Inativo');
    membro.status = 'Inativo';
  }

  trackPorId(_index: number, membro: Membro): string {
    return membro.id;
  }

  corRole(role: Role): string {
    if (ROLES_NIVEL_DIRETORIA.includes(role)) return 'text-yellow-600';
    if (ROLES_NIVEL_GERENCIA.includes(role)) return 'text-purple-600';
    return 'text-black';
  }

  // Membros criados direto no Firebase Console podem não ter o campo `status`
  // ainda. Tratamos ausência como 'Ativo' (assumindo que quem está cadastrado
  // na empresa está ativo, a menos que alguém explicitamente marque Inativo).
  statusEfetivo(membro: Membro): Membro['status'] {
    return membro.status ?? 'Ativo';
  }

  corBarra(role: Role): string {
    if (ROLES_NIVEL_DIRETORIA.includes(role)) return 'bg-yellow-400';
    if (ROLES_NIVEL_GERENCIA.includes(role)) return 'bg-purple-500';
    return 'bg-blue-500';
  }
}