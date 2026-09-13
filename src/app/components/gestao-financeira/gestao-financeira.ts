import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FinancialService, FinancialFilters } from '../../shared/services/financial.service';
import { FinancialEntry, FinancialEntryType} from '../../shared/interfaces/financial-interface';
import { StorageService } from '../../shared/services/storage.service';
import { AuthService } from '../../shared/services/auth';


interface FiltrosFinanceiros {
  type: FinancialEntryType | '';
  category: string;
  supplier: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
}


@Component({
  selector: 'app-gestao-financeira',
  standalone: false,
  templateUrl: './gestao-financeira.html',
  styleUrl: './gestao-financeira.scss'
})


export class GestaoFinanceira implements OnInit, OnDestroy {


  // LISTAGEM
  lancamentos = signal<FinancialEntry[]>([]);

  carregando = signal(false);

  consultaRealizada = signal(false);

  erro = signal('');

  sucesso = signal('');


  // PESQUISA
  textoPesquisa = signal('');

  termoPesquisa = signal('');


  // FILTROS
  modalFiltrosAberto = signal(false);

  formFiltros: FormGroup;

  filtrosAtivos = signal<FiltrosFinanceiros>({
    type: '',
    category: '',
    supplier: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });


  categorias = [
    'Operacional',
    'Administrativo',
    'Pessoal',
    'Marketing',
    'Projetos',
    'Impostos',
    'Outros'
  ];


  categoriasDisponiveis = computed(() => {

    const categoriasFirestore = this.lancamentos()
      .map(lancamento => lancamento.category)
      .filter(Boolean);

    return [
      ...new Set([
        ...this.categorias,
        ...categoriasFirestore
      ])
    ].sort();
  });


  // LINHAS EXPANDIDAS
  lancamentosAbertos = signal<string[]>([]);


  // MODAL CADASTRAR ENTRADA
  modalCadastroAberto = signal(false);

  salvandoCadastro = signal(false);

  formCadastro: FormGroup;

  // MODAL NOTA FISCAL
  modalNotaFiscalAberto = signal(false);

  enviandoNotaFiscal = signal(false);

  arquivoSelecionado = signal<File | null>(null);

  nomeArquivo = signal('');


  formNotaFiscal: FormGroup;

  private lancamentosSubscription?: Subscription;


  constructor(
    private fb: FormBuilder,
    private financialService: FinancialService,
    private storageService: StorageService,
    private authService: AuthService
  ) {

    // FORMULÁRIO DE FILTROS
    this.formFiltros = this.fb.group({
      type: [''],
      category: [''],
      supplier: [''],
      minAmount: [''],
      maxAmount: [''],
      startDate: [''],
      endDate: ['']
    });


    // FORMULÁRIO DE CADASTRO
    this.formCadastro = this.fb.group({

      title: [
        '',
        [
          Validators.required
        ]
      ],

      supplier: [
        '',
        [
          Validators.required
        ]
      ],

      amount: [
        '',
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ],

      type: [
        'entrada',
        [
          Validators.required
        ]
      ],

      category: [
        'Operacional',
        [
          Validators.required
        ]
      ],

      date: [
        this.obterDataAtualInput(),
        [
          Validators.required
        ]
      ]

    });


    // FORMULÁRIO DE NOTA FISCAL
    this.formNotaFiscal = this.fb.group({

      title: [
        '',
        [
          Validators.required
        ]
      ],

      supplier: [
        '',
        [
          Validators.required
        ]
      ],

      amount: [
        '',
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ],

      type: [
        'entrada',
        [
          Validators.required
        ]
      ],

      category: [
        'Faturamento',
        [
          Validators.required
        ]
      ],

      date: [
        this.obterDataAtualInput(),
        [
          Validators.required
        ]
      ]

    });

  }


  // CICLO DE VIDA
  ngOnInit(): void {

    this.buscarLancamentos();

  }


  ngOnDestroy(): void {

    this.lancamentosSubscription?.unsubscribe();

  }


  // PESQUISA
  atualizarTextoPesquisa(): void {

    this.termoPesquisa.set(
      this.textoPesquisa().trim()
    );

  }


  pesquisar(): void {

    this.termoPesquisa.set(
      this.textoPesquisa().trim()
    );

  }


  // LANÇAMENTOS FILTRADOS
  lancamentosFiltrados = computed(() => {

    const termo = this.normalizarTexto(
      this.termoPesquisa()
    );


    if (!termo) {

      return this.lancamentos();

    }


    return this.lancamentos().filter(lancamento => {

      const texto = [

        lancamento.title,

        lancamento.category,

        lancamento.supplier,

        this.formatarTipo(lancamento.type),

        this.formatarData(lancamento.date)

      ]
        .filter(Boolean)
        .join(' ');


      return this.normalizarTexto(texto)
        .includes(termo);

    });

  });


  // TOTAIS
  totalEntradas = computed(() =>

    this.lancamentosFiltrados()
      .filter(
        lancamento =>
          lancamento.type === 'entrada'
      )
      .reduce(
        (total, lancamento) =>
          total + Number(lancamento.amount || 0),
        0
      )

  );


  totalSaidas = computed(() =>

    this.lancamentosFiltrados()
      .filter(
        lancamento =>
          lancamento.type === 'saida'
      )
      .reduce(
        (total, lancamento) =>
          total + Number(lancamento.amount || 0),
        0
      )

  );


  saldo = computed(() =>

    this.totalEntradas()
    -
    this.totalSaidas()

  );


  // BUSCAR LANÇAMENTOS
  buscarLancamentos(): void {

    this.carregando.set(true);

    this.erro.set('');

    this.lancamentosSubscription?.unsubscribe();


    const filtrosAtuais =
      this.filtrosAtivos();


    const filtros: FinancialFilters = {

      type: filtrosAtuais.type,

      category:
        filtrosAtuais.category.trim(),

      supplier:
        filtrosAtuais.supplier.trim(),

      minAmount:
        this.converterNumero(
          filtrosAtuais.minAmount
        ),

      maxAmount:
        this.converterNumero(
          filtrosAtuais.maxAmount
        ),

      startDate:
        filtrosAtuais.startDate
          ? this.converterData(
              filtrosAtuais.startDate
            )
          : null,

      endDate:
        filtrosAtuais.endDate
          ? this.converterData(
              filtrosAtuais.endDate
            )
          : null

    };


    this.lancamentosSubscription =
      this.financialService
        .listarLancamentos(filtros)
        .subscribe({

          next: lancamentos => {

            const ordenados =
              [...lancamentos].sort(
                (a, b) =>
                  this.obterData(b.date).getTime()
                  -
                  this.obterData(a.date).getTime()
              );


            this.lancamentos.set(
              ordenados
            );


            this.carregando.set(false);

            this.consultaRealizada.set(true);

          },


          error: erro => {

            console.error(
              'Erro ao carregar lançamentos financeiros:',
              erro
            );


            this.erro.set(
              'Não foi possível carregar os lançamentos financeiros.'
            );


            this.lancamentos.set([]);

            this.carregando.set(false);

            this.consultaRealizada.set(true);

          }

        });

  }


  // FILTROS
  abrirFiltros(): void {

    const filtros =
      this.filtrosAtivos();


    this.formFiltros.reset({

      type: filtros.type,

      category: filtros.category,

      supplier: filtros.supplier,

      minAmount: filtros.minAmount,

      maxAmount: filtros.maxAmount,

      startDate: filtros.startDate,

      endDate: filtros.endDate

    });


    this.modalFiltrosAberto.set(true);

  }


  fecharFiltros(): void {

    this.modalFiltrosAberto.set(false);

  }


  aplicarFiltros(): void {

    const valores =
      this.formFiltros.getRawValue();


    const filtros: FiltrosFinanceiros = {

      type:
        valores.type || '',

      category:
        (valores.category || '').trim(),

      supplier:
        (valores.supplier || '').trim(),

      minAmount:
        valores.minAmount || '',

      maxAmount:
        valores.maxAmount || '',

      startDate:
        valores.startDate || '',

      endDate:
        valores.endDate || ''

    };


    this.filtrosAtivos.set(
      filtros
    );


    this.modalFiltrosAberto.set(
      false
    );


    this.buscarLancamentos();

  }


  limparFiltros(): void {

    const filtrosVazios:
      FiltrosFinanceiros = {

        type: '',

        category: '',

        supplier: '',

        minAmount: '',

        maxAmount: '',

        startDate: '',

        endDate: ''

      };


    this.formFiltros.reset(
      filtrosVazios
    );


    this.filtrosAtivos.set(
      filtrosVazios
    );


    this.buscarLancamentos();

  }


  // DETALHES
  abrirLancamento(id?: string): void {

    if (!id) {

      return;

    }


    this.lancamentosAbertos.update(
      ids => {

        if (ids.includes(id)) {

          return ids.filter(
            item => item !== id
          );

        }


        return [
          ...ids,
          id
        ];

      }
    );

  }


  lancamentoEstaAberto(
    id?: string
  ): boolean {

    if (!id) {

      return false;

    }


    return this.lancamentosAbertos()
      .includes(id);

  }


  // CADASTRAR ENTRADA
  abrirCadastro(): void {

    this.erro.set('');

    this.sucesso.set('');


    this.formCadastro.reset({

      title: '',

      supplier: '',

      amount: '',

      type: 'entrada',

      category: 'Operacional',

      date: this.obterDataAtualInput()

    });


    this.modalCadastroAberto.set(
      true
    );

  }


  fecharCadastro(): void {

    if (this.salvandoCadastro()) {

      return;

    }


    this.modalCadastroAberto.set(
      false
    );

  }


  async cadastrarLancamento(): Promise<void> {

    this.erro.set('');

    this.sucesso.set('');


    if (this.formCadastro.invalid) {

      this.formCadastro.markAllAsTouched();

      return;

    }


    this.salvandoCadastro.set(true);


    try {

      const valores =
        this.formCadastro.getRawValue();


      const lancamento:
        Omit<FinancialEntry, 'id'> = {

        title:
          valores.title.trim(),

        supplier:
          valores.supplier.trim(),

        amount:
          Number(valores.amount),

        type:
          valores.type as FinancialEntryType,

        category:
          valores.category.trim(),

        date:
          this.converterData(
            valores.date
          ),

        attachment:
          null

      };


      await this.financialService
        .adicionarLancamento(
          lancamento
        );


      this.modalCadastroAberto.set(
        false
      );


      this.sucesso.set(
        'Lançamento cadastrado com sucesso.'
      );


      this.buscarLancamentos();


    } catch (erro) {

      console.error(
        'Erro ao cadastrar lançamento:',
        erro
      );


      this.erro.set(
        'Não foi possível cadastrar o lançamento.'
      );


    } finally {

      this.salvandoCadastro.set(false);

    }

  }


  // NOTA FISCAL
  abrirNotaFiscal(): void {

    this.erro.set('');

    this.sucesso.set('');

    this.arquivoSelecionado.set(null);

    this.nomeArquivo.set('');


    this.formNotaFiscal.reset({

      title: '',

      supplier: '',

      amount: '',

      type: 'entrada',

      category: 'Faturamento',

      date: this.obterDataAtualInput()

    });


    this.modalNotaFiscalAberto.set(
      true
    );

  }


  fecharNotaFiscal(): void {

    if (this.enviandoNotaFiscal()) {

      return;

    }


    this.modalNotaFiscalAberto.set(
      false
    );

    this.arquivoSelecionado.set(
      null
    );

    this.nomeArquivo.set('');

  }


  selecionarArquivo(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const arquivo =
      input.files?.[0];


    if (!arquivo) {

      return;

    }


    this.erro.set('');


    const tiposPermitidos = [

      'application/pdf',

      'image/jpeg',

      'image/png',

      'image/webp',

      'image/jpg'

    ];


    const tamanhoMaximo =
      10 * 1024 * 1024;


    if (
      !tiposPermitidos.includes(
        arquivo.type
      )
    ) {

      this.erro.set(
        'O arquivo deve ser uma imagem ou um PDF.'
      );


      input.value = '';

      return;

    }


    if (
      arquivo.size > tamanhoMaximo
    ) {

      this.erro.set(
        'O arquivo deve ter no máximo 10 MB.'
      );


      input.value = '';

      return;

    }


    this.arquivoSelecionado.set(
      arquivo
    );


    this.nomeArquivo.set(
      arquivo.name
    );

  }


  removerArquivo(): void {

    this.arquivoSelecionado.set(
      null
    );

    this.nomeArquivo.set('');

  }


  async cadastrarNotaFiscal(): Promise<void> {

    this.erro.set('');

    this.sucesso.set('');


    if (this.formNotaFiscal.invalid) {

      this.formNotaFiscal.markAllAsTouched();

      return;

    }


    const arquivo =
      this.arquivoSelecionado();


    if (!arquivo) {

      this.erro.set(
        'Selecione uma nota fiscal ou comprovante.'
      );

      return;

    }


    this.enviandoNotaFiscal.set(
      true
    );


    try {

      const uid =
        await this.authService.getUid();


      if (!uid) {

        throw new Error(
          'Usuário não autenticado.'
        );

      }


      // 1. UPLOAD DO DOCUMENTO
      const url =
        await this.storageService
          .uploadDocumentoFinanceiro(
            uid,
            arquivo
          );


      // 2. DADOS DO LANÇAMENTO
      const valores =
        this.formNotaFiscal.getRawValue();


      const lancamento:
        Omit<FinancialEntry, 'id'> = {

        title:
          valores.title.trim(),

        supplier:
          valores.supplier.trim(),

        amount:
          Number(valores.amount),

        type:
          valores.type as FinancialEntryType,

        category:
          valores.category.trim(),

        date:
          this.converterData(
            valores.date
          ),

        attachment:
          url

      };

      // 3. SALVA NO FIRESTORE
      await this.financialService
        .adicionarLancamento(
          lancamento
        );


      // 4. FINALIZA
      this.modalNotaFiscalAberto.set(
        false
      );


      this.arquivoSelecionado.set(
        null
      );


      this.nomeArquivo.set('');


      this.sucesso.set(
        'Nota fiscal cadastrada com sucesso.'
      );


      this.buscarLancamentos();


    } catch (erro) {

      console.error(
        'Erro ao cadastrar nota fiscal:',
        erro
      );


      this.erro.set(
        'Não foi possível cadastrar a nota fiscal.'
      );


    } finally {

      this.enviandoNotaFiscal.set(
        false
      );

    }

  }

  // FORMATAÇÃO
  formatarMoeda(
    valor: number
  ): string {

    return new Intl.NumberFormat(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    ).format(
      valor || 0
    );

  }


  formatarTipo(
    tipo: FinancialEntryType
  ): string {

    return tipo === 'entrada'
      ? 'Entrada'
      : 'Saída';

  }


  formatarData(
    data: FinancialEntry['date']
  ): string {

    const dataConvertida =
      this.obterData(data);


    if (
      isNaN(
        dataConvertida.getTime()
      )
    ) {

      return '—';

    }


    return new Intl.DateTimeFormat(
      'pt-BR'
    ).format(
      dataConvertida
    );

  }


  obterData(
    data: FinancialEntry['date']
  ): Date {

    if (data instanceof Date) {

      return data;

    }


    if (
      data &&
      typeof data === 'object' &&
      'toDate' in data &&
      typeof data.toDate === 'function'
    ) {

      return data.toDate();

    }


    return new Date(
      data as unknown as string
    );

  }


  // AUXILIARES
  private converterData(
    valor: string
  ): Date {

    return new Date(
      `${valor}T12:00:00`
    );

  }


  private converterNumero(
    valor: string
  ): number | null {

    if (!valor) {

      return null;

    }


    const numero =
      Number(valor);


    return Number.isNaN(numero)
      ? null
      : numero;

  }


  private normalizarTexto(
    texto: string
  ): string {

    return texto
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .trim();

  }


  private obterDataAtualInput(): string {

    const hoje = new Date();


    const ano =
      hoje.getFullYear();


    const mes =
      String(
        hoje.getMonth() + 1
      ).padStart(2, '0');


    const dia =
      String(
        hoje.getDate()
      ).padStart(2, '0');


    return `${ano}-${mes}-${dia}`;

  }

}