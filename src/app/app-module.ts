import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Login } from './components/login/login';
import { GestaoProjetos } from './components/gestao-projetos/gestao-projetos';
import { Sidebar } from './shared/components/sidebar/sidebar';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { environment } from '../assets/environments/environment';
import { Cadastro } from './components/cadastro/cadastro';
import { Perfil } from './components/perfil/perfil';
import { RecuperarSenha } from './components/recuperar-senha/recuperar-senha';

@NgModule({
  declarations: [App, Login, Cadastro, GestaoProjetos, Perfil, Sidebar, RecuperarSenha],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
  ],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [App],
})
export class AppModule {}
