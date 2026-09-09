import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  AuthService
} from '../../shared/services/auth';

import {
  UserInterface
} from '../../shared/interfaces/user-interface';


interface ProgressaoGeral {
  faturamentoAcumulado: number;
  metaAnual: number;
  projetosAtivos: number;
  membrosAlocados: number;
  variacaoAnual: number;
}


type TipoIndicador =
  | 'essencial'
  | 'complementar';


interface IndicadorPortal {
  nome: string;
  tipo: TipoIndicador;
  progresso: number;
  gap: string;
}


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {

  usuario =
    signal<UserInterface | null>(
      null
    );


  //dados temporarios da progressao geral
  //depois serao alimentados pelo firebase
  progressaoGeral =
    signal<ProgressaoGeral>({

      faturamentoAcumulado:
        99999.99,

      metaAnual:
        99999.99,

      projetosAtivos:
        18,

      membrosAlocados:
        23,

      variacaoAnual:
        10.1

    });


  //indicadores temporarios do portal bj
  //a estrutura ja esta pronta para receber dados reais
  indicadoresPortal =
    signal<IndicadorPortal[]>([

      {
        nome:
          'CSAT',

        tipo:
          'essencial',

        progresso:
          70,

        gap:
          'R$ 99.999,99'
      },

      {
        nome:
          'Tempo de Permanência no MEJ',

        tipo:
          'essencial',

        progresso:
          72,

        gap:
          'R$ 99.999,99'
      },

      {
        nome:
          'Engajamento com o MEJ',

        tipo:
          'essencial',

        progresso:
          73,

        gap:
          'R$ 99.999,99'
      },

      {
        nome:
          'Políticas de Diversidade e Inclusão',

        tipo:
          'complementar',

        progresso:
          70,

        gap:
          'R$ 99.999,99'
      },

      {
        nome:
          'Faturamento Colaborativo',

        tipo:
          'complementar',

        progresso:
          72,

        gap:
          'R$ 99.999,99'
      },

      {
        nome:
          'Projetos de Impacto',

        tipo:
          'complementar',

        progresso:
          73,

        gap:
          'R$ 99.999,99'
      }

    ]);


  //percentual atingido da meta anual
  percentualMeta =
    computed(() => {

      const dados =
        this.progressaoGeral();


      if (
        dados.metaAnual <= 0
      ) {
        return 0;
      }


      const percentual =
        (
          dados.faturamentoAcumulado /
          dados.metaAnual
        ) * 100;


      return Math.min(
        percentual,
        100
      );
    });


  //valor que falta para atingir a meta
  gapMeta =
    computed(() => {

      const dados =
        this.progressaoGeral();


      return Math.max(
        dados.metaAnual -
        dados.faturamentoAcumulado,
        0
      );
    });


  constructor(
    private authService:
      AuthService
  ) {}


  ngOnInit(): void {

    //carrega os dados do usuario logado
    this.authService
      .getUserData()
      .subscribe(usuario => {

        this.usuario.set(
          usuario
        );

      });
  }


  //formata valores monetarios
  formatarMoeda(
    valor: number
  ): string {

    return valor
      .toLocaleString(
        'pt-BR',
        {
          style: 'currency',
          currency: 'BRL'
        }
      );
  }


  //formata percentual
  formatarPercentual(
    valor: number
  ): string {

    return valor
      .toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }
      );
  }


  //define a cor principal do indicador
  corIndicador(
    tipo: TipoIndicador
  ): string {

    return tipo === 'essencial'
      ? '#78c55d'
      : '#3d98e8';
  }


  //define a cor interna da barra
  corProgressoIndicador(
    tipo: TipoIndicador
  ): string {

    return tipo === 'essencial'
      ? '#6eaa5f'
      : '#568ead';
  }
}