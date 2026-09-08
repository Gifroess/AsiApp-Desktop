import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  AuthService
} from '../../shared/services/auth';

import {
  UserInterface
} from '../../shared/interfaces/user-interface';


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
}
