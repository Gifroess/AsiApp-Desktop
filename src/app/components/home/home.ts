import { Component, OnInit, computed, signal } from '@angular/core';
import { combineLatest } from 'rxjs';

import { AuthService } from '../../shared/services/auth';
import { DashboardService } from '../../shared/services/dashboard.service';
import { ProjectService, UsuarioProjeto } from '../../shared/services/project.service';

import {
  DashboardMetrics,
  PortalBjIndicator,
  PortalIndicatorType,
  PortalIndicatorUnit
} from '../../shared/interfaces/dashboard-interface';

import { ProjectInterface } from '../../shared/interfaces/project-interface';
import { UserInterface } from '../../shared/interfaces/user-interface';


interface ProgressaoGeral {
  faturamentoAcumulado: number;
  metaAnual: number;
  projetosAtivos: number;
  membrosAlocados: number;
  variacaoAnual: number;
}

interface IndicadorPortal {
  nome: string;
  tipo: PortalIndicatorType;
  progresso: number;
  gap: string;
}

interface ProjetoOverview {
  id: string;
  nome: string;
  area: string;
  gerente: string;
  valor: string;
  descricao: string;
  membros: string[];
}


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {

  private readonly anoAtual = new Date().getFullYear();

  usuario = signal<UserInterface | null>(null);
  projetosOverview = signal<ProjetoOverview[]>([]);
  indicadoresPortal = signal<IndicadorPortal[]>([]);

  progressaoGeral = signal<ProgressaoGeral>({
    faturamentoAcumulado: 0,
    metaAnual: 0,
    projetosAtivos: 0,
    membrosAlocados: 0,
    variacaoAnual: 0
  });


  percentualMeta = computed(() => {
    const dados = this.progressaoGeral();

    if (dados.metaAnual <= 0) {
      return 0;
    }

    const percentual = (dados.faturamentoAcumulado / dados.metaAnual) * 100;
    return Math.min(percentual, 100);
  });


  gapMeta = computed(() => {
    const dados = this.progressaoGeral();
    return Math.max(dados.metaAnual - dados.faturamentoAcumulado, 0);
  });


  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private projectService: ProjectService
  ) {}


  ngOnInit(): void {
    this.carregarUsuario();
    this.carregarDashboard();
    this.carregarProjetos();
  }


  //carrega o usuario logado
  private carregarUsuario(): void {
    this.authService.getUserData().subscribe(usuario => {
      this.usuario.set(usuario);
    });
  }


  //carrega os dados financeiros e indicadores
  private carregarDashboard(): void {
    combineLatest([
      this.dashboardService.listarMetricas(this.anoAtual),
      this.dashboardService.listarIndicadores(this.anoAtual)
    ]).subscribe({
      next: ([metricas, indicadores]) => {
        if (metricas) {
          this.atualizarMetricas(metricas);
        }

        const indicadoresConvertidos = indicadores.map(
          indicador => this.converterIndicador(indicador)
        );

        this.indicadoresPortal.set(indicadoresConvertidos);
      },

      error: erro => {
        console.error('Erro ao carregar indicadores da home:', erro);
      }
    });
  }


  //atualiza o resumo financeiro
  private atualizarMetricas(metricas: DashboardMetrics): void {
    const variacao = this.calcularVariacaoAnual(
      metricas.currentRevenue,
      metricas.previousYearRevenue
    );

    this.progressaoGeral.update(dados => ({
      ...dados,
      faturamentoAcumulado: metricas.currentRevenue,
      metaAnual: metricas.annualGoal,
      variacaoAnual: variacao
    }));
  }


  //adapta o indicador do firebase para o card
  private converterIndicador(indicador: PortalBjIndicator): IndicadorPortal {
    const progresso = indicador.goal > 0
      ? Math.min((indicador.achieved / indicador.goal) * 100, 100)
      : 0;

    const gap = Math.max(indicador.goal - indicador.achieved, 0);

    return {
      nome: indicador.name,
      tipo: indicador.type,
      progresso,
      gap: this.formatarValorIndicador(gap, indicador.unit)
    };
  }


  //carrega os projetos e usuarios
  private carregarProjetos(): void {
    combineLatest([
      this.projectService.listarProjetos(),
      this.projectService.listarUsuarios()
    ]).subscribe({
      next: ([projetos, usuarios]) => {
        const projetosAtivos = projetos.filter(
          projeto => !this.projetoConcluido(projeto.status)
        );

        const overview = projetosAtivos.map(
          projeto => this.converterProjeto(projeto, usuarios)
        );

        this.projetosOverview.set(overview);
        this.atualizarResumoProjetos(projetosAtivos);
      },

      error: erro => {
        console.error('Erro ao carregar projetos da home:', erro);
      }
    });
  }


  //adapta o projeto para o card da home
  private converterProjeto(
    projeto: ProjectInterface,
    usuarios: UsuarioProjeto[]
  ): ProjetoOverview {

    const membros = (projeto.memberIds || [])
      .map(id => usuarios.find(usuario => usuario.id === id)?.name)
      .filter((nome): nome is string => !!nome);

    return {
      id: projeto.id || '',
      nome: projeto.name || 'Projeto sem nome',
      area: projeto.area || '—',
      gerente: projeto.manager || '—',
      valor: this.formatarValorProjeto(projeto.value),
      descricao: projeto.description || 'Sem descrição cadastrada.',
      membros
    };
  }


  //atualiza os numeros de projetos
  private atualizarResumoProjetos(projetos: ProjectInterface[]): void {
    const membrosUnicos = new Set<string>();

    projetos.forEach(projeto => {
      (projeto.memberIds || []).forEach(id => membrosUnicos.add(id));
    });

    this.progressaoGeral.update(dados => ({
      ...dados,
      projetosAtivos: projetos.length,
      membrosAlocados: membrosUnicos.size
    }));
  }


  //calcula a variacao em relacao ao ano anterior
  private calcularVariacaoAnual(atual: number, anterior: number): number {
    if (anterior <= 0) {
      return 0;
    }

    return ((atual - anterior) / anterior) * 100;
  }


  //considera concluido apenas o status finalizado
  private projetoConcluido(status?: string): boolean {
    const statusNormalizado = (status || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    return statusNormalizado === 'concluido';
  }


  //formata os valores dos indicadores
  private formatarValorIndicador(valor: number, unidade: PortalIndicatorUnit): string {
    if (unidade === 'moeda') {
      return this.formatarMoeda(valor);
    }

    if (unidade === 'percentual') {
      return `${this.formatarPercentual(valor)}%`;
    }

    return valor.toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    });
  }


  //formata o valor salvo nos projetos
  private formatarValorProjeto(valor?: string): string {
    if (!valor) {
      return 'R$ 0,00';
    }

    let texto = valor.replace('R$', '').trim();

    if (texto.includes(',')) {
      texto = texto.replace(/\./g, '').replace(',', '.');
    }

    const numero = Number(texto.replace(/[^\d.-]/g, ''));

    return Number.isNaN(numero)
      ? valor
      : this.formatarMoeda(numero);
  }


  //formata valores monetarios
  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }


  //formata percentual
  formatarPercentual(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }


  //define a cor principal do indicador
  corIndicador(tipo: PortalIndicatorType): string {
    return tipo === 'essencial'
      ? '#78c55d'
      : '#3d98e8';
  }


  //define a cor interna da barra
  corProgressoIndicador(tipo: PortalIndicatorType): string {
    return tipo === 'essencial'
      ? '#6eaa5f'
      : '#568ead';
  }
}