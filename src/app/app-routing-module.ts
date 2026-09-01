import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { GestaoProjetos } from './components/gestao-projetos/gestao-projetos';

const routes: Routes = [
  {path: '', component: Login},
  {path: 'gestao-projetos', component: GestaoProjetos},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
