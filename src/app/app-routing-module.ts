import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { RecuperarSenha } from './components/recuperar-senha/recuperar-senha';

const routes: Routes = [
  {path: '', component: Login},
  {path: 'recuperar-senha', component: RecuperarSenha},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
