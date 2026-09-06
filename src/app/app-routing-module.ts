import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Cadastro } from './components/cadastro/cadastro';
import { Perfil } from './components/perfil/perfil';
import { RecuperarSenha } from './components/recuperar-senha/recuperar-senha';
import { GestaoProjetos } from './components/gestao-projetos/gestao-projetos';
import { GestaoPessoas } from './components/gestao-pessoas/gestao-pessoas';
import { authGuard } from './shared/guards/auth.guard';

const routes: Routes = [
  { path: '', component: Login },
  { path: 'cadastro', component: Cadastro },
  { path: 'recuperar-senha', component: RecuperarSenha },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: 'projetos', component: GestaoProjetos, canActivate: [authGuard] },
  { path: 'pessoas', component: GestaoPessoas, canActivate: [authGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}