import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Perfil } from './components/perfil/perfil';

const routes: Routes = [
  {path: '', component: Login},
  { path: 'perfil', component: Perfil }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
