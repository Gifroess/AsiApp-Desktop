import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth';

interface Kpi {
  label: string;
  valor: string;
  sub: string;
}

interface Indicador {
  nome: string;
  alcancado: number;
  meta: number;
  gap: string;
  tipo: 'essencial' | 'complementar';
}

interface Projeto {
  nome: string;
  gerentes: string;
  membros: number;
  orcamento: string;
  descricao: string;
  alocados: string[];
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  //nome real do membro logado; placeholder ate carregar
  nomeMembro = 'Nome do Membro';

  faturamento = { alcancado: 99999.99, meta: 99999.99 };

  kpis: Kpi[] = [
    { label: 'Faturamento acumulado', valor: 'R$ 99.999,99', sub: '+10,1% vs 2025' },
    { label: 'Meta Anual', valor: 'R$ 99.999,99', sub: 'Faltam R$0,00' },
    { label: 'Projetos Ativos', valor: '18', sub: '23 Membros Alocados' },
  ];

  indicadores: Indicador[] = [
    { nome: 'CSAT', alcancado: 82, meta: 100, gap: 'R$99.999,99', tipo: 'essencial' },
    { nome: 'Tempo de Permanencia no MEJ', alcancado: 74, meta: 100, gap: 'R$99.999,99', tipo: 'essencial' },
    { nome: 'Engajamento com o MEJ', alcancado: 90, meta: 100, gap: 'R$99.999,99', tipo: 'essencial' },
    { nome: 'Politicas de Diversidade e Inclusao', alcancado: 61, meta: 100, gap: 'R$99.999,99', tipo: 'complementar' },
    { nome: 'Faturamento Colaborativo', alcancado: 55, meta: 100, gap: 'R$99.999,99', tipo: 'complementar' },
    { nome: 'Projetos de Impacto', alcancado: 68, meta: 100, gap: 'R$99.999,99', tipo: 'complementar' },
  ];

  private descricaoPadrao =
    'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae ' +
    'pellentes que sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam.';

  projetos: Projeto[] = [
    {
      nome: 'Nome do Projeto1',
      gerentes: 'NomeGerentes',
      membros: 5,
      orcamento: 'R$99.999,99',
      descricao: this.descricaoPadrao,
      alocados: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4', 'Pessoa 5'],
    },
    {
      nome: 'Nome do Projeto2',
      gerentes: 'NomeGerentes',
      membros: 8,
      orcamento: 'R$99.999,99',
      descricao: this.descricaoPadrao,
      alocados: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4', 'Pessoa 5', 'Pessoa 6', 'Pessoa 7', 'Pessoa 8'],
    },
    {
      nome: 'Nome do Projeto3',
      gerentes: 'NomeGerentes',
      membros: 4,
      orcamento: 'R$99.999,99',
      descricao: this.descricaoPadrao,
      alocados: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4'],
    },
    {
      nome: 'Nome do Projeto4',
      gerentes: 'NomeGerentes',
      membros: 6,
      orcamento: 'R$99.999,99',
      descricao: this.descricaoPadrao,
      alocados: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4', 'Pessoa 5', 'Pessoa 6'],
    },
  ];

  constructor(private auth: AuthService) {
    this.auth.getUserData().subscribe((u) => {
      if (u?.name) this.nomeMembro = u.name;
    });
  }

  get faturamentoPct(): number {
    return this.faturamento.meta
      ? Math.round((this.faturamento.alcancado / this.faturamento.meta) * 100)
      : 0;
  }

  get faturamentoGap(): string {
    return this.formatBRL(this.faturamento.meta - this.faturamento.alcancado);
  }

  indicadorPct(i: Indicador): number {
    return i.meta ? Math.round((i.alcancado / i.meta) * 100) : 0;
  }

  formatBRL(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
