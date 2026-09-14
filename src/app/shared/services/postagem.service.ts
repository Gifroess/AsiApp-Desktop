import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, filter, firstValueFrom, take } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

export interface PostagemFirebase {
  id?: string;
  autorUid: string;
  curtidoPor: string[];
  dataCriacao: any;
  fotoAutorUrl: string | null;
  imagemUrl: string | null;
  nomeAutor: string;
  repostadoPor: string[];
  texto: string;
}

export interface AutorPostagem {
  uid: string;
  nome: string;
  fotoUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PostagemService {
  private colecao = 'postagens';

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  listarPostagens(): Observable<PostagemFirebase[]> {
    return this.firestore
      .collection<PostagemFirebase>(this.colecao)
      .valueChanges({ idField: 'id' });
  }

  // espera a sessão carregar antes de buscar os dados do autor
  async obterAutorAtual(): Promise<AutorPostagem> {
    const usuario = await firstValueFrom(
      this.auth.authState.pipe(
        filter((user): user is firebase.User => user !== null),
        take(1)
      )
    );

    const documento = await this.firestore.firestore
      .collection('users')
      .doc(usuario.uid)
      .get();

    const dados: any = documento.data() ?? {};

    return {
      uid: usuario.uid,
      nome:
        dados.nome ??
        dados.name ??
        dados.nomeCompleto ??
        usuario.displayName ??
        usuario.email?.split('@')[0] ??
        'Membro',
      fotoUrl:
        dados.photoUrl ??
        dados.fotoUrl ??
        dados.fotoPerfilUrl ??
        usuario.photoURL ??
        null
    };
  }

  async publicarPost(texto: string, imagemUrl: string | null, autor: AutorPostagem): Promise<void> {
    const id = this.firestore.createId();

    return this.firestore.firestore
      .collection(this.colecao)
      .doc(id)
      .set({
        autorUid: autor.uid,
        curtidoPor: [],
        dataCriacao: new Date(),
        fotoAutorUrl: autor.fotoUrl,
        imagemUrl,
        nomeAutor: autor.nome,
        repostadoPor: [],
        texto
      });
  }

  // usa o mesmo caminho de imagens usado pelo mobile
  async enviarImagem(arquivo: File, uid: string): Promise<string> {
    const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const nomeArquivo = `${uid}_${Date.now()}_${nomeSeguro}`;
    const storage = this.firestore.firestore.app.storage();
    const referencia = storage.ref(`postagens/${nomeArquivo}`);

    const upload = await referencia.put(arquivo);
    return upload.ref.getDownloadURL();
  }

  async alterarCurtida(id: string, uid: string, jaCurtiu: boolean): Promise<void> {
    const referencia = this.firestore.firestore.collection(this.colecao).doc(id);
    const documento = await referencia.get();
    const dados = documento.data() as PostagemFirebase | undefined;

    if (!dados) return;

    const curtidoPor = Array.isArray(dados.curtidoPor) ? dados.curtidoPor : [];

    const novaLista = jaCurtiu
      ? curtidoPor.filter(item => item !== uid)
      : curtidoPor.includes(uid)
        ? curtidoPor
        : [...curtidoPor, uid];

    await referencia.update({ curtidoPor: novaLista });
  }

  async alterarRepost(id: string, uid: string, jaRepostou: boolean): Promise<void> {
    const referencia = this.firestore.firestore.collection(this.colecao).doc(id);
    const documento = await referencia.get();
    const dados = documento.data() as PostagemFirebase | undefined;

    if (!dados) return;

    const repostadoPor = Array.isArray(dados.repostadoPor) ? dados.repostadoPor : [];

    const novaLista = jaRepostou
      ? repostadoPor.filter(item => item !== uid)
      : repostadoPor.includes(uid)
        ? repostadoPor
        : [...repostadoPor, uid];

    await referencia.update({ repostadoPor: novaLista });
  }
}