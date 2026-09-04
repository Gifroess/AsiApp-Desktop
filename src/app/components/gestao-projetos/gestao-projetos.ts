import { Component } from '@angular/core';

interface Projeto {
  nome: string;
  gerente: string;
  area: string;
  prazo: string;
  valor: string;
  status: string;
  cor: string;
  membros: string[];
  descricao: string;
  aberto: boolean;
}

@Component({
  selector: 'app-gestao-projetos',
  standalone: false,
  styleUrl: './gestao-projetos.scss',
  templateUrl: './gestao-projetos.html',
})
export class GestaoProjetos {
  //projetos cadastrados
  projetos: Projeto[] = [
    {
      nome: 'Projeto Asimov',
      gerente: 'Lucas',
      area: 'Marketing',
      prazo: '30/09/2026',
      valor: 'R$99.999,99',
      status: 'Em andamento',
      cor: 'bg-yellow-400',
      membros: ['Lucas', 'Ana', 'Carlos'],
      descricao: 'Projeto voltado para criação e evolução do aplicativo Asimov.',
      aberto: false,
    },

    {
      nome: 'Aplicativo Mobile',
      gerente: 'Giovanna',
      area: 'Desenvolvimento',
      prazo: '15/10/2026',
      valor: 'R$50.000,00',
      status: 'A iniciar',
      cor: 'bg-blue-500',
      membros: ['Giovanna', 'Pedro'],
      descricao: 'Desenvolvimento da aplicação mobile integrada ao sistema.',
      aberto: false,
    },
  ];

  //abre ou fecha detalhes do projeto
  abrirProjeto(projeto: Projeto) {
    projeto.aberto = !projeto.aberto;
  }
}
