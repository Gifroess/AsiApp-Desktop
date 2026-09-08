import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Cadastro } from './components/cadastro/cadastro';
import { RecuperarSenha } from './components/recuperar-senha/recuperar-senha';
import { Home } from './components/home/home';
import { Perfil } from './components/perfil/perfil';
import { GestaoProjetos } from './components/gestao-projetos/gestao-projetos';
import { GestaoPessoas } from './components/gestao-pessoas/gestao-pessoas';
import { authGuard } from './shared/guards/auth.guard';


const routes: Routes = [

  //login
  {
    path: '',
    component: Login
  },

  {
    path: 'login',
    component: Login
  },


  //cadastro
  {
    path: 'cadastro',
    component: Cadastro
  },


  //recuperacao de senha
  {
    path: 'recuperar-senha',
    component: RecuperarSenha
  },


  //home
  {
    path: 'home',
    component: Home,
    canActivate: [authGuard]
  },


  //perfil
  {
    path: 'perfil',
    component: Perfil,
    canActivate: [authGuard]
  },


  //gestao de projetos
  {
    path: 'projetos',
    component: GestaoProjetos,
    canActivate: [authGuard]
  },


  //gestao de pessoas
  {
    path: 'pessoas',
    component: GestaoPessoas,
    canActivate: [authGuard]
  },


  //redireciona rotas inexistentes para o login
  {
    path: '**',
    redirectTo: ''
  }

];


@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}