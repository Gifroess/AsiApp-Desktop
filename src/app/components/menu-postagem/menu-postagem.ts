import { Location } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

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
  id: number;
  nome: string;
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

  mesExibido = signal(
    new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1)
  );

  dataSelecionada = signal(new Date());
  seletorAreasAberto = signal(false);
  areaSelecionada = signal('');
  nomeEvento = signal('');
  horarioDigitado = signal('');

  eventos = signal<EventoLista[]>([]);

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
    this.mesExibido().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  );

  dataSelecionadaFormatada = computed(() =>
    this.dataSelecionada().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  );

  dataSelecionadaInput = computed(() => {
    const data = this.dataSelecionada();

    return `${data.getFullYear()}-${String(
      data.getMonth() + 1
    ).padStart(2, '0')}-${String(
      data.getDate()
    ).padStart(2, '0')}`;
  });

  textoAreaSelecionada = computed(() =>
    this.areaSelecionada() || 'Selecione uma área'
  );

  diasCalendario = computed(() =>
    this.gerarDiasCalendario()
  );

  eventosDoDia = computed(() =>
    this.eventos().filter(evento =>
      this.mesmaData(evento.data, this.dataSelecionada())
    )
  );

  constructor(private location: Location) {}

  //gera os dias exibidos no calendário
  private gerarDiasCalendario(): DiaCalendario[] {

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

      const data = new Date(
        ano,
        numeroMes,
        indice - diasAntes + 1
      );

      return {
        data,
        numero: data.getDate(),
        mesAtual: data.getMonth() === numeroMes,
        hoje: this.mesmaData(data, this.hoje),
        selecionado: this.mesmaData(data, selecionada)
      };
    });
  }

  //seleciona um dia do calendário
  selecionarDia(dia: DiaCalendario): void {

    this.dataSelecionada.set(dia.data);

    if (!dia.mesAtual) {
      this.mesExibido.set(
        new Date(
          dia.data.getFullYear(),
          dia.data.getMonth(),
          1
        )
      );
    }
  }

  //altera a data pelo campo do formulário
  selecionarDataInput(valor: string): void {

    const [ano, mes, dia] = valor.split('-').map(Number);

    if (!ano || !mes || !dia) return;

    const data = new Date(ano, mes - 1, dia);

    this.dataSelecionada.set(data);
    this.mesExibido.set(new Date(ano, mes - 1, 1));
  }

  //adiciona um novo evento na lista local
  adicionarEvento(): void {

    if (
      !this.nomeEvento() ||
      !this.horarioDigitado() ||
      !this.areaSelecionada()
    ) {
      alert('Preencha todos os campos do evento.');
      return;
    }

    const novoEvento: EventoLista = {
      id: Date.now(),
      nome: this.nomeEvento(),
      horario: this.horarioDigitado(),
      data: this.dataSelecionada(),
      areas: [this.areaSelecionada()]
    };

    this.eventos.update(lista => [
      ...lista,
      novoEvento
    ]);

    this.nomeEvento.set('');
    this.horarioDigitado.set('');
    this.areaSelecionada.set('');
  }

  atualizarNomeEvento(valor: string): void {
    this.nomeEvento.set(valor);
  }

  //troca o mês exibido
  mesAnterior(): void {

    const mes = this.mesExibido();

    this.mesExibido.set(
      new Date(
        mes.getFullYear(),
        mes.getMonth() - 1,
        1
      )
    );
  }

  proximoMes(): void {

    const mes = this.mesExibido();

    this.mesExibido.set(
      new Date(
        mes.getFullYear(),
        mes.getMonth() + 1,
        1
      )
    );
  }

  alternarSeletorAreas(): void {
    this.seletorAreasAberto.update(valor => !valor);
  }

  selecionarArea(area: string): void {
    this.areaSelecionada.set(area);
    this.seletorAreasAberto.set(false);
  }

  //formata o horário durante a digitação
  formatarHorario(input: HTMLInputElement): void {

    let numeros = input.value
      .replace(/\D/g, '')
      .slice(0, 4);

    if (numeros.length > 2) {
      numeros = `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
    }

    input.value = numeros;
    this.horarioDigitado.set(numeros);
  }

  private mesmaData(dataA: Date, dataB: Date): boolean {

    return (
      dataA.getFullYear() === dataB.getFullYear() &&
      dataA.getMonth() === dataB.getMonth() &&
      dataA.getDate() === dataB.getDate()
    );
  }

  voltar(): void {
    this.location.back();
  }
}