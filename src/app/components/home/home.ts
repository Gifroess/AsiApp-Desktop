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


  //dados temporarios do prototipo
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
}