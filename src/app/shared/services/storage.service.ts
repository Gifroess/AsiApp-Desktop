import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(
    private storage: AngularFireStorage
  ) {}

  uploadFotoPerfil(
    uid: string,
    file: File
  ): Promise<string> {

    const path = `perfil/${uid}/foto.jpg`;

    const ref = this.storage.ref(path);
    const task = this.storage.upload(path, file);

    return new Promise((resolve, reject) => {

      task.snapshotChanges()
        .pipe(
          finalize(async () => {

            try {

              const url = await ref
                .getDownloadURL()
                .toPromise();

              resolve(url);

            } catch (err) {

              reject(err);

            }

          })
        )
        .subscribe();
    });
  }


  uploadDocumentoFinanceiro(
    uid: string,
    file: File
  ): Promise<string> {

    const nomeArquivo = file.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    const nomeUnico = `${Date.now()}_${nomeArquivo}`;

    const path = `financeiro/${uid}/${nomeUnico}`;

    const ref = this.storage.ref(path);
    const task = this.storage.upload(path, file);

    return new Promise((resolve, reject) => {

      task.snapshotChanges()
        .pipe(
          finalize(async () => {

            try {

              const url = await ref
                .getDownloadURL()
                .toPromise();

              resolve(url);

            } catch (err) {

              reject(err);

            }

          })
        )
        .subscribe();
    });
  }
}