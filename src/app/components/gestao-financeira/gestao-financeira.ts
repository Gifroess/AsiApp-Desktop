import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import { Subscription } from 'rxjs';
import { FinancialService, FinancialFilters } from '../../shared/services/financial.service';
import { FinancialEntry, FinancialEntryType } from '../../shared/interfaces/financial-interface';

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


  lancamentos = signal<FinancialEntry[]>([]);

  carregando = signal(false);
  consultaRealizada = signal(false);
  erro = signal('');

  textoPesquisa = signal('');
  termoPesquisa = signal('');


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


  lancamentosAbertos = signal<string[]>([]);


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

      return this.normalizarTexto(texto).includes(termo);
    });
  });


  totalEntradas = computed(() =>
    this.lancamentosFiltrados()
      .filter(lancamento => lancamento.type === 'entrada')
      .reduce(
        (total, lancamento) => total + Number(lancamento.amount || 0),
        0
      )
  );

  totalSaidas = computed(() =>
    this.lancamentosFiltrados()
      .filter(lancamento => lancamento.type === 'saida')
      .reduce(
        (total, lancamento) => total + Number(lancamento.amount || 0),
        0
      )
  );

  saldo = computed(() =>
    this.totalEntradas() - this.totalSaidas()
  );


  private lancamentosSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private financialService: FinancialService
  ) {

    this.formFiltros = this.fb.group({
      type: [''],
      category: [''],
      supplier: [''],
      minAmount: [''],
      maxAmount: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.buscarLancamentos();
  }

  ngOnDestroy(): void {
    this.lancamentosSubscription?.unsubscribe();
  }


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


  buscarLancamentos(): void {

    this.carregando.set(true);
    this.erro.set('');

    this.lancamentosSubscription?.unsubscribe();

    const filtrosAtuais = this.filtrosAtivos();

    const filtros: FinancialFilters = {
      type: filtrosAtuais.type,
      category: filtrosAtuais.category.trim(),
      supplier: filtrosAtuais.supplier.trim(),

      minAmount: this.converterNumero(
        filtrosAtuais.minAmount
      ),

      maxAmount: this.converterNumero(
        filtrosAtuais.maxAmount
      ),

      startDate: filtrosAtuais.startDate
        ? this.converterData(filtrosAtuais.startDate)
        : null,

      endDate: filtrosAtuais.endDate
        ? this.converterData(filtrosAtuais.endDate)
        : null
    };

    this.lancamentosSubscription =
      this.financialService
        .listarLancamentos(filtros)
        .subscribe({

          next: lancamentos => {

            const ordenados = [...lancamentos].sort(
              (a, b) =>
                this.obterData(b.date).getTime() -
                this.obterData(a.date).getTime()
            );

            this.lancamentos.set(ordenados);

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


  abrirFiltros(): void {

    const filtros = this.filtrosAtivos();

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

    const valores = this.formFiltros.getRawValue();

    const filtros: FiltrosFinanceiros = {
      type: valores.type || '',
      category: (valores.category || '').trim(),
      supplier: (valores.supplier || '').trim(),
      minAmount: valores.minAmount || '',
      maxAmount: valores.maxAmount || '',
      startDate: valores.startDate || '',
      endDate: valores.endDate || ''
    };

    this.filtrosAtivos.set(filtros);

    this.modalFiltrosAberto.set(false);

    this.buscarLancamentos();
  }

  limparFiltros(): void {

    const filtrosVazios: FiltrosFinanceiros = {
      type: '',
      category: '',
      supplier: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    };

    this.formFiltros.reset(filtrosVazios);

    this.filtrosAtivos.set(filtrosVazios);

    this.buscarLancamentos();
  }


  abrirLancamento(id?: string): void {

    if (!id) {
      return;
    }

    this.lancamentosAbertos.update(ids => {

      if (ids.includes(id)) {
        return ids.filter(item => item !== id);
      }

      return [...ids, id];
    });
  }

  lancamentoEstaAberto(id?: string): boolean {

    if (!id) {
      return false;
    }

    return this.lancamentosAbertos().includes(id);
  }


  formatarMoeda(valor: number): string {

    return new Intl.NumberFormat(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    ).format(valor || 0);
  }

  formatarTipo(tipo: FinancialEntryType): string {

    return tipo === 'entrada'
      ? 'Entrada'
      : 'Saída';
  }

  formatarData(
    data: FinancialEntry['date']
  ): string {

    const dataConvertida = this.obterData(data);

    if (isNaN(dataConvertida.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'pt-BR'
    ).format(dataConvertida);
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

    return new Date(data as unknown as string);
  }

  private converterData(valor: string): Date {

    return new Date(`${valor}T12:00:00`);
  }

  private converterNumero(
    valor: string
  ): number | null {

    if (!valor) {
      return null;
    }

    const numero = Number(valor);

    return Number.isNaN(numero)
      ? null
      : numero;
  }

  private normalizarTexto(
    texto: string
  ): string {

    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}