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

  //eventos temporarios para validar a listagem
  eventosExemplo: EventoLista[] = [
    {
      id: 1,
      nome: 'Evento 1',
      horario: '18:00',
      areas: ['Área1', 'Área2', 'Área3']
    },
    {
      id: 2,
      nome: 'Evento 2',
      horario: '18:00',
      areas: ['Área1', 'Área2', 'Área3']
    }
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
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  });

  textoAreaSelecionada = computed(() =>
    this.areaSelecionada() || 'Selecione uma área'
  );

  diasCalendario = computed(() => this.gerarDiasCalendario());

  constructor(private location: Location) {}

  //monta os dias exibidos no calendario
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

  //seleciona um dia do calendario
  selecionarDia(dia: DiaCalendario): void {
    this.dataSelecionada.set(dia.data);

    if (!dia.mesAtual) {
      this.mesExibido.set(
        new Date(dia.data.getFullYear(), dia.data.getMonth(), 1)
      );
    }
  }

  //altera a data pelo formulario
  selecionarDataInput(valor: string): void {
    const [ano, mes, dia] = valor.split('-').map(Number);

    if (!ano || !mes || !dia) return;

    const data = new Date(ano, mes - 1, dia);
    this.dataSelecionada.set(data);
    this.mesExibido.set(new Date(ano, mes - 1, 1));
  }

  //volta um mes
  mesAnterior(): void {
    const mes = this.mesExibido();

    this.mesExibido.set(
      new Date(mes.getFullYear(), mes.getMonth() - 1, 1)
    );
  }

  //avanca um mes
  proximoMes(): void {
    const mes = this.mesExibido();

    this.mesExibido.set(
      new Date(mes.getFullYear(), mes.getMonth() + 1, 1)
    );
  }

  //abre ou fecha a lista de areas
  alternarSeletorAreas(): void {
    this.seletorAreasAberto.update(aberto => !aberto);
  }

  //seleciona uma area
  selecionarArea(area: string): void {
    this.areaSelecionada.set(area);
    this.seletorAreasAberto.set(false);
  }

  //formata o horario enquanto o usuario digita
  formatarHorario(input: HTMLInputElement): void {
    let numeros = input.value.replace(/\D/g, '').slice(0, 4);

    if (numeros.length > 2) {
      numeros = `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
    }

    input.value = numeros;
  }

  //compara duas datas
  private mesmaData(dataA: Date, dataB: Date): boolean {
    return dataA.getFullYear() === dataB.getFullYear()
      && dataA.getMonth() === dataB.getMonth()
      && dataA.getDate() === dataB.getDate();
  }

  //volta para a tela anterior
  voltar(): void {
    this.location.back();
  }
}