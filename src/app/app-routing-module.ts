import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Cadastro } from './components/cadastro/cadastro';
import { RecuperarSenha } from './components/recuperar-senha/recuperar-senha';
import { Perfil } from './components/perfil/perfil';
import { GestaoProjetos } from './components/gestao-projetos/gestao-projetos';


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


  //recuperação de senha
  {
    path: 'recuperar-senha',
    component: RecuperarSenha
  },


  //perfil
  {
    path: 'perfil',
    component: Perfil
  },


  //gestão de projetos
  {
    path: 'projetos',
    component: GestaoProjetos
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