import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { combineLatest } from 'rxjs';

import {
  ProjectService,
  ProjectPayload,
  UsuarioProjeto
} from '../../shared/services/project.service';

import { ProjectInterface } from '../../shared/interfaces/project-interface';


interface Projeto {
  id?: string;
  nome: string;
  cliente: string;
  gerente: string;
  gerenteId: string;
  area: string;
  prazo: string;
  valor: string;
  status: string;
  cor: string;
  membroIds: string[];
  membros: string[];
  descricao: string;
  progresso: number;
  aberto: boolean;
}


interface FiltrosProjeto {
  area: string;
  dataInicio: string;
  dataFim: string;
  valorMin: string;
  valorMax: string;
}


@Component({
  selector: 'app-gestao-projetos',
  standalone: false,
  styleUrl: './gestao-projetos.scss',
  templateUrl: './gestao-projetos.html',
})
export class GestaoProjetos implements OnInit {

  projetos = signal<Projeto[]>([]);
  usuarios = signal<UsuarioProjeto[]>([]);

  textoPesquisa = signal('');
  termoPesquisa = signal('');

  modalProjetoAberto = signal(false);
  modalFiltrosAberto = signal(false);
  modalExclusaoAberto = signal(false);

  equipeAberta = signal(false);

  modoEdicao = signal(false);

  projetoEditandoId =
    signal<string | null>(null);

  projetoParaExcluir =
    signal<Projeto | null>(null);

  isSalvando = signal(false);
  isExcluindo = signal(false);

  mensagemErroProjeto = signal('');
  mensagemErroExclusao = signal('');

  formProjeto: FormGroup;
  formFiltros: FormGroup;


  filtrosAtivos =
    signal<FiltrosProjeto>({
      area: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: ''
    });


  areasDisponiveis =
    computed(() => {

      const areas =
        this.projetos()
          .map(projeto => projeto.area)
          .filter(area =>
            !!area &&
            area !== '-'
          );

      return [
        ...new Set(areas)
      ].sort();
    });


  projetosFiltrados =
    computed(() => {

      const termo =
        this.normalizarTexto(
          this.termoPesquisa()
        );

      const filtros =
        this.filtrosAtivos();


      return this.projetos()
        .filter(projeto => {

          //pesquisa
          if (termo) {

            const campos = [
              projeto.nome,
              projeto.cliente,
              projeto.gerente,
              projeto.area,
              projeto.status
            ].map(campo =>
              this.normalizarTexto(campo)
            );


            if (
              !campos.some(campo =>
                campo.includes(termo)
              )
            ) {
              return false;
            }
          }


          //area
          if (
            filtros.area &&
            projeto.area !== filtros.area
          ) {
            return false;
          }


          //data inicial
          if (
            filtros.dataInicio &&
            (
              !projeto.prazo ||
              projeto.prazo < filtros.dataInicio
            )
          ) {
            return false;
          }


          //data final
          if (
            filtros.dataFim &&
            (
              !projeto.prazo ||
              projeto.prazo > filtros.dataFim
            )
          ) {
            return false;
          }


          const valor =
            this.converterValorParaNumero(
              projeto.valor
            );


          //valor minimo
          if (
            filtros.valorMin &&
            valor < Number(filtros.valorMin)
          ) {
            return false;
          }


          //valor maximo
          if (
            filtros.valorMax &&
            valor > Number(filtros.valorMax)
          ) {
            return false;
          }


          return true;
        });
    });


  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder
  ) {

    this.formProjeto =
      this.fb.group({

        name: [
          '',
          Validators.required
        ],

        client: [
          '',
          Validators.required
        ],

        area: [
          '',
          Validators.required
        ],

        managerId: [
          '',
          Validators.required
        ],

        memberIds: [
          []
        ],

        deadline: [
          '',
          Validators.required
        ],

        value: [
          '',
          [
            Validators.required,
            Validators.min(0)
          ]
        ],

        status: [
          'A Iniciar',
          Validators.required
        ],

        description: [
          ''
        ]

      });


    this.formFiltros =
      this.fb.group({

        area: [''],

        dataInicio: [''],

        dataFim: [''],

        valorMin: [''],

        valorMax: ['']

      });
  }


  ngOnInit(): void {
    this.carregarDados();
  }


  //carrega projetos e usuarios
  carregarDados(): void {

    combineLatest([
      this.projectService.listarProjetos(),
      this.projectService.listarUsuarios()
    ])
      .subscribe({

        next: ([
          projects,
          usuarios
        ]) => {

          this.usuarios.set(
            usuarios
          );


          const estadosAbertos =
            new Map(
              this.projetos()
                .map(projeto => [
                  projeto.id,
                  projeto.aberto
                ])
            );


          const projetosConvertidos =
            projects.map(project => {

              const convertido =
                this.converterProjeto(
                  project
                );


              convertido.aberto =
                estadosAbertos
                  .get(project.id)
                ?? false;


              return convertido;
            });


          this.projetos.set(
            projetosConvertidos
          );
        },


        error: (erro) => {

          console.error(
            'Erro ao carregar dados:',
            erro
          );

        }

      });
  }


  //adapta os dados do firebase
  private converterProjeto(
    project: ProjectInterface
  ): Projeto {

    const status =
      this.formatarStatus(
        project.status
      );


    const membros =
      (project.memberIds || [])
        .map(id =>
          this.usuarios()
            .find(usuario =>
              usuario.id === id
            )
            ?.name
        )
        .filter(
          (
            nome
          ): nome is string =>
            !!nome
        );


    return {

      id:
        project.id,

      nome:
        project.name ||
        'Projeto sem nome',

      cliente:
        project.client ||
        '',

      gerente:
        project.manager ||
        '-',

      gerenteId:
        project.managerId ||
        '',

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
        this.corPorStatus(
          status
        ),

      membroIds:
        project.memberIds ||
        [],

      membros,

      descricao:
        project.description ||
        'Sem descrição cadastrada.',

      progresso:
        project.progress || 0,

      aberto:
        false
    };
  }


  //filtra enquanto o usuario digita
  atualizarTextoPesquisa(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const valor =
      input.value;


    this.textoPesquisa.set(
      valor
    );

    this.termoPesquisa.set(
      valor.trim()
    );
  }


  //mantem o botao da lupa funcional
  pesquisar(): void {

    this.termoPesquisa.set(
      this.textoPesquisa()
        .trim()
    );
  }


  //abre cadastro
  abrirCadastroProjeto(): void {

    this.modoEdicao.set(false);

    this.projetoEditandoId.set(
      null
    );

    this.equipeAberta.set(false);

    this.mensagemErroProjeto.set(
      ''
    );


    this.formProjeto.reset({

      name: '',

      client: '',

      area: '',

      managerId: '',

      memberIds: [],

      deadline: '',

      value: '',

      status: 'A Iniciar',

      description: ''

    });


    this.modalProjetoAberto.set(
      true
    );
  }


  //abre edicao
  abrirEdicaoProjeto(
    projeto: Projeto
  ): void {

    this.modoEdicao.set(true);

    this.projetoEditandoId.set(
      projeto.id || null
    );

    this.equipeAberta.set(false);

    this.mensagemErroProjeto.set(
      ''
    );


    //o gerente nao precisa ficar
    //tambem marcado no seletor de equipe
    const membrosSemGerente =
      projeto.membroIds
        .filter(id =>
          id !== projeto.gerenteId
        );


    this.formProjeto.reset({

      name:
        projeto.nome,

      client:
        projeto.cliente,

      area:
        projeto.area,

      managerId:
        projeto.gerenteId,

      memberIds:
        membrosSemGerente,

      deadline:
        projeto.prazo,

      value:
        this.valorParaInput(
          projeto.valor
        ),

      status:
        this.statusParaFirebase(
          projeto.status
        ),

      description:
        projeto.descricao ===
        'Sem descrição cadastrada.'
          ? ''
          : projeto.descricao

    });


    this.modalProjetoAberto.set(
      true
    );
  }


  //fecha cadastro ou edicao
  fecharModalProjeto(): void {

    if (this.isSalvando()) {
      return;
    }


    this.equipeAberta.set(false);

    this.modalProjetoAberto.set(
      false
    );

    this.mensagemErroProjeto.set(
      ''
    );
  }


  //abre ou fecha o seletor de equipe
  alternarSeletorEquipe(): void {

    this.equipeAberta.update(
      aberto => !aberto
    );
  }


  //fecha o seletor
  fecharSeletorEquipe(): void {

    this.equipeAberta.set(false);
  }


  //remove da equipe quem passou a ser gerente
  aoAlterarGerente(): void {

    const gerenteId =
      this.formProjeto
        .get('managerId')
        ?.value;


    if (!gerenteId) {
      return;
    }


    const control =
      this.formProjeto
        .get('memberIds');


    const atuais: string[] =
      control?.value || [];


    if (
      atuais.includes(
        gerenteId
      )
    ) {

      control?.setValue(
        atuais.filter(id =>
          id !== gerenteId
        )
      );
    }
  }


  //texto exibido no campo equipe
  textoEquipeSelecionada(): string {

    const ids: string[] =
      this.formProjeto
        .get('memberIds')
        ?.value || [];


    if (
      ids.length === 0
    ) {
      return 'Selecione os membros';
    }


    const nomes =
      ids
        .map(id =>
          this.usuarios()
            .find(usuario =>
              usuario.id === id
            )
            ?.name
        )
        .filter(
          (
            nome
          ): nome is string =>
            !!nome
        );


    if (
      nomes.length === 0
    ) {
      return 'Selecione os membros';
    }


    if (
      nomes.length <= 2
    ) {
      return nomes.join(', ');
    }


    return `${
      nomes
        .slice(0, 2)
        .join(', ')
    } +${nomes.length - 2}`;
  }


  //verifica se o membro esta selecionado
  membroSelecionado(
    id: string
  ): boolean {

    const ids =
      this.formProjeto
        .get('memberIds')
        ?.value || [];


    return ids.includes(id);
  }


  //marca ou desmarca membro
  alternarMembro(
    id: string,
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const control =
      this.formProjeto
        .get('memberIds');


    const atuais: string[] =
      control?.value || [];


    if (input.checked) {

      control?.setValue([
        ...new Set([
          ...atuais,
          id
        ])
      ]);

    } else {

      control?.setValue(
        atuais.filter(
          membroId =>
            membroId !== id
        )
      );
    }
  }


  //salva cadastro ou edicao
  async salvarProjeto():
    Promise<void> {

    this.mensagemErroProjeto.set(
      ''
    );


    if (
      this.formProjeto.invalid
    ) {

      this.formProjeto
        .markAllAsTouched();


      this.mensagemErroProjeto.set(
        'Preencha todos os campos obrigatórios.'
      );

      return;
    }


    const dados =
      this.formProjeto
        .getRawValue();


    const gerente =
      this.usuarios()
        .find(usuario =>
          usuario.id ===
            dados.managerId
        );


    if (!gerente) {

      this.mensagemErroProjeto.set(
        'Selecione um gerente válido.'
      );

      return;
    }


    this.isSalvando.set(
      true
    );


    try {

      //o gerente sempre faz parte do projeto
      const memberIds =
        [
          ...new Set([
            ...(dados.memberIds || []),
            dados.managerId
          ])
        ];


      const existente =
        this.projetos()
          .find(projeto =>
            projeto.id ===
              this.projetoEditandoId()
          );


      const payload:
        ProjectPayload = {

        name:
          dados.name.trim(),

        client:
          dados.client.trim(),

        area:
          dados.area.trim(),

        manager:
          gerente.name,

        managerId:
          gerente.id,

        memberIds,

        members:
          `${memberIds.length} ${
            memberIds.length === 1
              ? 'pessoa'
              : 'pessoas'
          }`,

        progress:
          existente?.progresso
          ?? 0,

        status:
          dados.status,

        color:
          this.corFirebasePorStatus(
            dados.status
          ),

        value:
          this.formatarValorFirebase(
            dados.value
          ),

        deadline:
          dados.deadline
            ? new Date(
                `${dados.deadline}T12:00:00`
              )
            : null,

        description:
          dados.description
            ?.trim()
          || ''
      };


      if (
        this.modoEdicao() &&
        this.projetoEditandoId()
      ) {

        await this.projectService
          .atualizarProjeto(
            this.projetoEditandoId()!,
            payload
          );

      } else {

        await this.projectService
          .cadastrarProjeto(
            payload
          );
      }


      this.equipeAberta.set(false);

      this.modalProjetoAberto.set(
        false
      );


    } catch (erro) {

      console.error(
        'Erro ao salvar projeto:',
        erro
      );


      this.mensagemErroProjeto.set(
        'Não foi possível salvar o projeto.'
      );

    } finally {

      this.isSalvando.set(
        false
      );
    }
  }


  //abre confirmacao de exclusao
  solicitarExclusao(
    projeto: Projeto
  ): void {

    this.projetoParaExcluir.set(
      projeto
    );

    this.mensagemErroExclusao.set(
      ''
    );

    this.modalExclusaoAberto.set(
      true
    );
  }


  //cancela exclusao
  cancelarExclusao(): void {

    if (this.isExcluindo()) {
      return;
    }


    this.modalExclusaoAberto.set(
      false
    );

    this.projetoParaExcluir.set(
      null
    );
  }


  //confirma exclusao
  async confirmarExclusao():
    Promise<void> {

    const projeto =
      this.projetoParaExcluir();


    if (!projeto?.id) {
      return;
    }


    this.isExcluindo.set(
      true
    );

    this.mensagemErroExclusao.set(
      ''
    );


    try {

      await this.projectService
        .excluirProjeto(
          projeto.id
        );


      this.modalExclusaoAberto.set(
        false
      );

      this.projetoParaExcluir.set(
        null
      );


    } catch (erro) {

      console.error(
        'Erro ao excluir projeto:',
        erro
      );


      this.mensagemErroExclusao.set(
        'Não foi possível excluir o projeto.'
      );

    } finally {

      this.isExcluindo.set(
        false
      );
    }
  }


  //abre filtros
  abrirFiltros(): void {

    const filtros =
      this.filtrosAtivos();


    this.formFiltros.reset({
      ...filtros
    });


    this.modalFiltrosAberto.set(
      true
    );
  }


  //fecha filtros
  fecharFiltros(): void {

    this.modalFiltrosAberto.set(
      false
    );
  }


  //aplica filtros
  aplicarFiltros(): void {

    const dados =
      this.formFiltros
        .getRawValue();


    this.filtrosAtivos.set({

      area:
        dados.area || '',

      dataInicio:
        dados.dataInicio || '',

      dataFim:
        dados.dataFim || '',

      valorMin:
        dados.valorMin || '',

      valorMax:
        dados.valorMax || ''

    });


    this.modalFiltrosAberto.set(
      false
    );
  }


  //limpa filtros
  limparFiltros(): void {

    const filtrosVazios:
      FiltrosProjeto = {

      area: '',

      dataInicio: '',

      dataFim: '',

      valorMin: '',

      valorMax: ''
    };


    this.formFiltros.reset(
      filtrosVazios
    );


    this.filtrosAtivos.set(
      filtrosVazios
    );
  }


  //atualiza somente o prazo
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

    const anterior =
      projeto.prazo;


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

      const prazo =
        valor
          ? new Date(
              `${valor}T12:00:00`
            )
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


      this.projetos.update(
        projetos =>
          projetos.map(item =>
            item.id === projeto.id
              ? {
                  ...item,
                  prazo: anterior
                }
              : item
          )
      );
    }
  }


  //abre ou fecha detalhes
  abrirProjeto(
    projeto: Projeto
  ): void {

    this.projetos.update(
      projetos =>
        projetos.map(item =>
          item.id === projeto.id
            ? {
                ...item,
                aberto:
                  !item.aberto
              }
            : item
        )
    );
  }


  //normaliza texto para pesquisa
  private normalizarTexto(
    valor: string
  ): string {

    return (valor || '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .trim();
  }


  //padroniza status para exibicao
  private formatarStatus(
    status?: string
  ): string {

    const normalizado =
      (status || '')
        .trim()
        .toLowerCase();


    switch (normalizado) {

      case 'em andamento':
        return 'Em andamento';

      case 'a iniciar':
        return 'A iniciar';

      case 'concluído':
      case 'concluido':
        return 'Concluído';

      default:
        return status ||
          'A iniciar';
    }
  }


  //status usado pelo firebase
  private statusParaFirebase(
    status: string
  ): string {

    switch (status) {

      case 'Em andamento':
        return 'Em Andamento';

      case 'Concluído':
        return 'Concluído';

      default:
        return 'A Iniciar';
    }
  }


  //cor visual da tabela
  private corPorStatus(
    status: string
  ): string {

    switch (status) {

      case 'Em andamento':
        return '#d88900';

      case 'Concluído':
        return '#36a82f';

      default:
        return '#168be8';
    }
  }


  //cor salva no firebase
  private corFirebasePorStatus(
    status: string
  ): string {

    switch (status) {

      case 'Em Andamento':
        return 'D88900';

      case 'Concluído':
        return '36A82F';

      default:
        return '168BE8';
    }
  }


  //formata prazo para input
  private formatarPrazoParaInput(
    deadline:
      ProjectInterface['deadline']
      | Date
      | null
  ): string {

    if (!deadline) {
      return '';
    }


    let data: Date;


    if (
      deadline instanceof Date
    ) {

      data = deadline;

    } else if (
      typeof deadline === 'object' &&
      'toDate' in deadline &&
      typeof deadline.toDate ===
        'function'
    ) {

      data =
        deadline.toDate();

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


  //converte valor salvo para numero
  private converterValorParaNumero(
    valor: string
  ): number {

    let texto =
      String(valor || '')
        .replace('R$', '')
        .trim();


    if (
      texto.includes(',')
    ) {

      texto =
        texto
          .replace(/\./g, '')
          .replace(',', '.');
    }


    const numero =
      Number(
        texto.replace(
          /[^\d.-]/g,
          ''
        )
      );


    return Number.isNaN(numero)
      ? 0
      : numero;
  }


  //prepara valor para edicao
  private valorParaInput(
    valor: string
  ): string {

    return this
      .converterValorParaNumero(
        valor
      )
      .toFixed(2);
  }


  //padroniza valor salvo
  private formatarValorFirebase(
    valor: string | number
  ): string {

    const numero =
      this.converterValorParaNumero(
        String(valor)
      );


    return `R$ ${numero.toFixed(2)}`;
  }
}