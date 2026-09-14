import { Component, Input, OnInit, signal } from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';
import { UserInterface } from '../../interfaces/user-interface';


@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})

export class Sidebar implements OnInit {

  @Input() paginaAtiva = '';

  usuario = signal<UserInterface | null>(null);

  podeAcessarFinanceiro = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}


  ngOnInit(): void {
    //carrega os dados do usuário logado
    this.authService.getUserData().subscribe(usuario => {
      this.usuario.set(usuario);
      this.podeAcessarFinanceiro = usuario?.role === 'Presidência' || usuario?.role === 'Diretoria';
    });
  }


  //navega entre as páginas disponíveis
  navegar(rota: string): void {
    this.router.navigate([rota]);
    if (rota === 'financeiro') {
      this.router.navigate(['/gestao-financeira']);
      return;
  }
  }

  async logout(): Promise<void> {
  await this.authService.logout();
}


}