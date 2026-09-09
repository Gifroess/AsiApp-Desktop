import { Component, OnInit, computed, signal } from '@angular/core';
import { combineLatest } from 'rxjs';

import { AuthService } from '../../shared/services/auth';
import { ProjectService, UsuarioProjeto } from '../../shared/services/project.service';

import { ProjectInterface } from '../../shared/interfaces/project-interface';
import { UserInterface } from '../../shared/interfaces/user-interface';


interface ProgressaoGeral {
  faturamentoAcumulado: number;
  metaAnual: number;
  projetosAtivos: number;
  membrosAlocados: number;
  variacaoAnual: number;
}

type TipoIndicador = 'essencial' | 'complementar';

interface IndicadorPortal {
  nome: string;
  tipo: TipoIndicador;
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

  usuario = signal<UserInterface | null>(null);
  projetosOverview = signal<ProjetoOverview[]>([]);

  //dados financeiros temporarios
  progressaoGeral = signal<ProgressaoGeral>({
    faturamentoAcumulado: 99999.99,
    metaAnual: 99999.99,
    projetosAtivos: 0,
    membrosAlocados: 0,
    variacaoAnual: 10.1
  });

  //indicadores temporarios do portal bj
  indicadoresPortal = signal<IndicadorPortal[]>([
    {
      nome: 'CSAT',
      tipo: 'essencial',
      progresso: 70,
      gap: 'R$ 99.999,99'
    },
    {
      nome: 'Tempo de Permanência no MEJ',
      tipo: 'essencial',
      progresso: 72,
      gap: 'R$ 99.999,99'
    },
    {
      nome: 'Engajamento com o MEJ',
      tipo: 'essencial',
      progresso: 73,
      gap: 'R$ 99.999,99'
    },
    {
      nome: 'Políticas de Diversidade e Inclusão',
      tipo: 'complementar',
      progresso: 70,
      gap: 'R$ 99.999,99'
    },
    {
      nome: 'Faturamento Colaborativo',
      tipo: 'complementar',
      progresso: 72,
      gap: 'R$ 99.999,99'
    },
    {
      nome: 'Projetos de Impacto',
      tipo: 'complementar',
      progresso: 73,
      gap: 'R$ 99.999,99'
    }
  ]);


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

    return Math.max(
      dados.metaAnual - dados.faturamentoAcumulado,
      0
    );
  });


  constructor(
    private authService: AuthService,
    private projectService: ProjectService
  ) {}


  ngOnInit(): void {
    this.carregarUsuario();
    this.carregarProjetos();
  }


  //carrega o usuario logado
  private carregarUsuario(): void {
    this.authService.getUserData().subscribe(usuario => {
      this.usuario.set(usuario);
    });
  }


  //carrega os projetos e usuarios do firebase
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


  //atualiza os numeros de projetos da progressao geral
  private atualizarResumoProjetos(
    projetos: ProjectInterface[]
  ): void {

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


  //considera concluido apenas o status finalizado
  private projetoConcluido(status?: string): boolean {
    const statusNormalizado = (status || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    return statusNormalizado === 'concluido';
  }


  //formata o valor salvo nos projetos
  private formatarValorProjeto(valor?: string): string {
    if (!valor) {
      return 'R$ 0,00';
    }

    let texto = valor.replace('R$', '').trim();

    if (texto.includes(',')) {
      texto = texto
        .replace(/\./g, '')
        .replace(',', '.');
    }

    const numero = Number(
      texto.replace(/[^\d.-]/g, '')
    );

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
  corIndicador(tipo: TipoIndicador): string {
    return tipo === 'essencial'
      ? '#78c55d'
      : '#3d98e8';
  }


  //define a cor interna da barra
  corProgressoIndicador(tipo: TipoIndicador): string {
    return tipo === 'essencial'
      ? '#6eaa5f'
      : '#568ead';
  }
}