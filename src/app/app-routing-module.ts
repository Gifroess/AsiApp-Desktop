import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Cadastro } from './components/cadastro/cadastro';
import { RecuperarSenha } from './components/recuperar-senha/recuperar-senha';
import { Home } from './components/home/home';
import { Perfil } from './components/perfil/perfil';
import { GestaoProjetos } from './components/gestao-projetos/gestao-projetos';

const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'cadastro', component: Cadastro },
  { path: 'recuperar-senha', component: RecuperarSenha },
  { path: 'home', component: Home },
  { path: 'perfil', component: Perfil },
  { path: 'gestao-projetos', component: GestaoProjetos },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
