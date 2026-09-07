import { Component, OnInit, signal } from '@angular/core';

import { ProjectService } from '../../shared/services/project.service';
import { ProjectInterface } from '../../shared/interfaces/project-interface';


interface Projeto {
  id?: string;
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
export class GestaoProjetos implements OnInit {

  projetos = signal<Projeto[]>([]);


  constructor(
    private projectService: ProjectService
  ) {}


  ngOnInit(): void {
    this.carregarProjetos();
  }


  //busca os projetos cadastrados no firebase
  carregarProjetos(): void {

    this.projectService
      .listarProjetos()
      .subscribe({

        next: (projects) => {

          const estadosAbertos = new Map(
            this.projetos().map(projeto => [
              projeto.id,
              projeto.aberto
            ])
          );


          const projetosConvertidos =
            projects.map(project => {

              const projetoConvertido =
                this.converterProjeto(project);

              projetoConvertido.aberto =
                estadosAbertos.get(project.id) ?? false;

              return projetoConvertido;
            });


          this.projetos.set(
            projetosConvertidos
          );
        },


        error: (erro) => {

          console.error(
            'Erro ao carregar projetos:',
            erro
          );

        }

      });
  }


  //adapta os dados do firebase para a listagem
  private converterProjeto(
    project: ProjectInterface
  ): Projeto {

    const status =
      this.formatarStatus(
        project.status
      );


    return {

      id: project.id,

      nome:
        project.name ||
        'Projeto sem nome',

      gerente:
        project.manager ||
        '-',

      area:
        project.area ||
        '-',

      prazo:
        this.formatarPrazoParaInput(
          project.deadline
        ),

      valor:
        project.value ||
        '-',

      status,

      cor:
        this.corPorStatus(status),

      membros: [],

      descricao:
        project.description ||
        'Sem descrição cadastrada.',

      aberto: false

    };
  }


  //padroniza os status
  private formatarStatus(
    status?: string
  ): string {

    const statusNormalizado =
      (status || '')
        .trim()
        .toLowerCase();


    switch (statusNormalizado) {

      case 'em andamento':
        return 'Em andamento';

      case 'a iniciar':
        return 'A iniciar';

      case 'concluído':
      case 'concluido':
        return 'Concluído';

      default:
        return status || 'A iniciar';

    }
  }


  //define a cor visual pelo status
  private corPorStatus(
    status: string
  ): string {

    switch (status) {

      case 'Em andamento':
        return '#d88900';

      case 'A iniciar':
        return '#168be8';

      case 'Concluído':
        return '#36a82f';

      default:
        return '#168be8';

    }
  }


  //converte a data do firebase para o input
  private formatarPrazoParaInput(
    deadline: ProjectInterface['deadline'] | Date | null
  ): string {

    if (!deadline) {
      return '';
    }


    let data: Date;


    if (deadline instanceof Date) {

      data = deadline;

    } else if (
      typeof deadline === 'object' &&
      'toDate' in deadline &&
      typeof deadline.toDate === 'function'
    ) {

      data = deadline.toDate();

    } else {

      return '';

    }


    const ano =
      data.getFullYear();

    const mes =
      String(
        data.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        data.getDate()
      ).padStart(2, '0');


    return `${ano}-${mes}-${dia}`;
  }


  //abre o seletor de data
  abrirCalendario(
    input: HTMLInputElement
  ): void {

    if (
      typeof input.showPicker === 'function'
    ) {

      input.showPicker();

      return;
    }


    input.focus();
  }


  //altera e salva o prazo
  async alterarPrazo(
    projeto: Projeto,
    event: Event
  ): Promise<void> {

    if (!projeto.id) {
      return;
    }


    const input =
      event.target as HTMLInputElement;

    const valor =
      input.value;

    const prazoAnterior =
      projeto.prazo;


    //atualiza a tela imediatamente
    this.projetos.update(
      projetos =>
        projetos.map(item =>
          item.id === projeto.id
            ? {
                ...item,
                prazo: valor
              }
            : item
        )
    );


    try {

      const prazo = valor
        ? new Date(`${valor}T12:00:00`)
        : null;


      await this.projectService
        .atualizarPrazo(
          projeto.id,
          prazo
        );

    } catch (erro) {

      console.error(
        'Erro ao atualizar prazo:',
        erro
      );


      //restaura o prazo anterior
      this.projetos.update(
        projetos =>
          projetos.map(item =>
            item.id === projeto.id
              ? {
                  ...item,
                  prazo: prazoAnterior
                }
              : item
          )
      );
    }
  }


  //abre ou fecha os detalhes
  abrirProjeto(
    projeto: Projeto
  ): void {

    this.projetos.update(
      projetos =>
        projetos.map(item =>
          item.id === projeto.id
            ? {
                ...item,
                aberto: !item.aberto
              }
            : item
        )
    );
  }
}