import { Location } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { EventoService } from '../../shared/services/evento.service';

interface AreaCalendario {
  nome: string;
  cor: string;
}

interface DiaCalendario {
  data: Date;
  numero: number;
  mesAtual: boolean;
  hoje: boolean;
  selecionado: boolean;
}

interface EventoLista {
  id?: string;
  titulo: string;
  horario: string;
  data: Date;
  areas: string[];
}

@Component({
  selector: 'app-menu-postagem',
  standalone: false,
  templateUrl: './menu-postagem.html',
  styleUrl: './menu-postagem.scss'
})
export class MenuPostagem {
  private hoje = new Date();

  abaAtiva = signal<'calendario' | 'feed'>('calendario');
  mesExibido = signal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));
  dataSelecionada = signal(new Date());
  seletorAreasAberto = signal(false);
  areasSelecionadas = signal<string[]>([]);
  nomeEvento = signal('');
  horarioDigitado = signal('');
  eventos = signal<EventoLista[]>([]);
  eventoEditando = signal<string | null>(null);

  diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

  areas: AreaCalendario[] = [
    { nome: 'Geral', cor: '#171c35' },
    { nome: 'Ciência de Dados', cor: '#654542' },
    { nome: 'Desktop', cor: '#7c6cf2' },
    { nome: 'Mobile', cor: '#bf4fd8' },
    { nome: 'Sites', cor: '#a52d31' },
    { nome: 'Marketing e Design', cor: '#ff4147' },
    { nome: 'Vendas', cor: '#ffb52c' },
    { nome: 'Presidência', cor: '#48bfe6' },
    { nome: 'Recursos Humanos', cor: '#e766bf' },
    { nome: 'Vice-Presidência', cor: '#f45485' },
    { nome: 'Estratégia e Qualidade', cor: '#8b2ce1' },
    { nome: 'Outros', cor: '#a8aab6' }
  ];

  nomeMes = computed(() =>
    this.mesExibido().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  );

  dataSelecionadaFormatada = computed(() =>
    this.dataSelecionada().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  );

  dataSelecionadaInput = computed(() => {
    const data = this.dataSelecionada();
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  });

  textoAreaSelecionada = computed(() => {
    const areas = this.areasSelecionadas();

    if (!areas.length) return 'Selecione uma área';
    if (areas.length === 1) return areas[0];

    return `${areas.length} áreas selecionadas`;
  });

  diasCalendario = computed(() => this.gerarDiasCalendario());

  eventosDoDia = computed(() =>
    this.eventos().filter(evento => this.mesmaData(evento.data, this.dataSelecionada()))
  );

  constructor(
    private location: Location,
    private eventoService: EventoService
  ) {
    this.carregarEventos();
  }

  abrirFeed(): void {
    this.seletorAreasAberto.set(false);
    this.abaAtiva.set('feed');
  }

  abrirCalendario(): void {
    this.abaAtiva.set('calendario');
  }

  carregarEventos(): void {
    this.eventoService.listarEventos().subscribe(eventos => {
      this.eventos.set(
        eventos.map(evento => ({
          id: evento.id,
          titulo: evento.titulo,
          horario: evento.horario,
          data: evento.data instanceof Date ? evento.data : evento.data.toDate(),
          areas: evento.areas
        }))
      );
    });
  }

  adicionarEvento(): void {
    if (!this.nomeEvento() || !this.horarioDigitado() || !this.areasSelecionadas().length) {
      alert('Preencha todos os campos do evento.');
      return;
    }

    const evento = {
      titulo: this.nomeEvento(),
      horario: this.horarioDigitado(),
      data: this.dataSelecionada(),
      areas: this.areasSelecionadas()
    };

    const id = this.eventoEditando();

    if (id) {
      this.eventoService.atualizarEvento(id, evento)
        .then(() => this.limparFormulario())
        .catch(erro => console.error('Erro ao atualizar evento:', erro));

      return;
    }

    this.eventoService.adicionarEvento(evento)
      .then(() => this.limparFormulario())
      .catch(erro => console.error('Erro ao adicionar evento:', erro));
  }

  editarEvento(evento: EventoLista): void {
    this.nomeEvento.set(evento.titulo);
    this.horarioDigitado.set(evento.horario);
    this.areasSelecionadas.set(evento.areas);
    this.dataSelecionada.set(evento.data);
    this.eventoEditando.set(evento.id ?? null);
  }

  excluirEvento(id?: string): void {
    if (!id) return;

    this.eventoService.excluirEvento(id)
      .catch(erro => console.error('Erro ao excluir evento:', erro));
  }

  limparFormulario(): void {
    this.nomeEvento.set('');
    this.horarioDigitado.set('');
    this.areasSelecionadas.set([]);
    this.eventoEditando.set(null);
    this.seletorAreasAberto.set(false);
  }

  gerarDiasCalendario(): DiaCalendario[] {
    const mes = this.mesExibido();
    const selecionada = this.dataSelecionada();
    const ano = mes.getFullYear();
    const numeroMes = mes.getMonth();
    const primeiroDia = new Date(ano, numeroMes, 1);
    const ultimoDia = new Date(ano, numeroMes + 1, 0);
    const diasAntes = (primeiroDia.getDay() + 6) % 7;
    const totalDias = diasAntes + ultimoDia.getDate();
    const totalCelulas = Math.ceil(totalDias / 7) * 7;

    return Array.from({ length: totalCelulas }, (_, indice) => {
      const data = new Date(ano, numeroMes, indice - diasAntes + 1);

      return {
        data,
        numero: data.getDate(),
        mesAtual: data.getMonth() === numeroMes,
        hoje: this.mesmaData(data, this.hoje),
        selecionado: this.mesmaData(data, selecionada)
      };
    });
  }

  selecionarDia(dia: DiaCalendario): void {
    this.dataSelecionada.set(dia.data);

    if (!dia.mesAtual) {
      this.mesExibido.set(new Date(dia.data.getFullYear(), dia.data.getMonth(), 1));
    }
  }

  selecionarDataInput(valor: string): void {
    const [ano, mes, dia] = valor.split('-').map(Number);

    if (!ano || !mes || !dia) return;

    const data = new Date(ano, mes - 1, dia);

    this.dataSelecionada.set(data);
    this.mesExibido.set(new Date(ano, mes - 1, 1));
  }

  atualizarNomeEvento(valor: string): void {
    this.nomeEvento.set(valor);
  }

  alternarSeletorAreas(): void {
    this.seletorAreasAberto.update(valor => !valor);
  }

  selecionarArea(area: string): void {
    this.areasSelecionadas.update(lista => {
      if (lista.includes(area)) {
        return lista.filter(item => item !== area);
      }

      return [...lista, area];
    });
  }

  areaSelecionada(area: string): boolean {
    return this.areasSelecionadas().includes(area);
  }

  corArea(area: string): string {
    return this.areas.find(item => item.nome === area)?.cor ?? '#a8aab6';
  }

  diaPossuiEvento(data: Date): boolean {
    return this.eventos().some(evento => this.mesmaData(evento.data, data));
  }

  corDiaEvento(data: Date): string {
    const evento = this.eventos().find(item => this.mesmaData(item.data, data));

    if (!evento) return 'transparent';

    return this.corArea(evento.areas[0]);
  }

  mesAnterior(): void {
    const mes = this.mesExibido();
    this.mesExibido.set(new Date(mes.getFullYear(), mes.getMonth() - 1, 1));
  }

  proximoMes(): void {
    const mes = this.mesExibido();
    this.mesExibido.set(new Date(mes.getFullYear(), mes.getMonth() + 1, 1));
  }

  formatarHorario(input: HTMLInputElement): void {
    let numeros = input.value.replace(/\D/g, '').slice(0, 4);

    if (numeros.length > 2) {
      numeros = `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
    }

    input.value = numeros;
    this.horarioDigitado.set(numeros);
  }

  mesmaData(dataA: Date, dataB: Date): boolean {
    return dataA.getFullYear() === dataB.getFullYear()
      && dataA.getMonth() === dataB.getMonth()
      && dataA.getDate() === dataB.getDate();
  }

  voltar(): void {
    this.location.back();
  }
}