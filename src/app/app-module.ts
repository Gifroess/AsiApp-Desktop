import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { Login } from './components/login/login';
import { Cadastro } from './components/cadastro/cadastro';
import { GestaoProjetos } from './components/gestao-projetos/gestao-projetos';
import { GestaoPessoas } from './components/gestao-pessoas/gestao-pessoas';
import { Perfil } from './components/perfil/perfil';
import { GestaoFinanceira } from './components/gestao-financeira/gestao-financeira';

import { Sidebar } from './shared/components/sidebar/sidebar';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

import { environment } from '../assets/environments/environment';
import { Home } from './components/home/home';

@NgModule({
  declarations: [App, Login, Cadastro, GestaoProjetos, GestaoPessoas, Perfil, Sidebar, Home, GestaoFinanceira],

  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FormsModule,

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
  ],

  providers: [provideBrowserGlobalErrorListeners()],

  bootstrap: [App],
})
export class AppModule {}
