/**
 * Migração pontual: coleção `usuarios` (modelo antigo) -> `users` (modelo das Firestore Rules).
 *
 * Converte `cargo` -> `role` e descarta `status`. Idempotente: reexecutar não duplica nem
 * sobrescreve um doc de `users` que já exista (usa merge só para campos ausentes via create-if-missing).
 *
 * Pré-requisitos:
 *   1. npm i -D firebase-admin
 *   2. Baixar a chave privada em: Firebase Console -> Configurações do projeto ->
 *      Contas de serviço -> "Gerar nova chave privada". Salvar como scripts/serviceAccountKey.json
 *      (esse arquivo NÃO deve ser commitado).
 *
 * Uso:
 *   node scripts/migrate-usuarios-to-users.mjs            # aplica
 *   node scripts/migrate-usuarios-to-users.mjs --dry-run  # só mostra o que faria
 *
 * Depois de confirmar que `users` está correto, apague a coleção `usuarios` pelo console.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const here = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(here, 'serviceAccountKey.json'), 'utf8'));

const DRY_RUN = process.argv.includes('--dry-run');

// cargo (antigo) -> role (novo, igual aos níveis das Firestore Rules)
const CARGO_TO_ROLE = {
  Membro: 'Membro',
  Gerente: 'Gerência',
  'Vice-Presidente': 'Vice-Presidência',
  Diretor: 'Diretoria',
  Presidente: 'Presidência',
};

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const origem = await db.collection('usuarios').get();

if (origem.empty) {
  console.log('Coleção `usuarios` vazia ou inexistente. Nada a migrar.');
  process.exit(0);
}

let migrados = 0;
let pulados = 0;

for (const doc of origem.docs) {
  const antigo = doc.data();
  const alvo = db.collection('users').doc(doc.id);

  if ((await alvo.get()).exists) {
    console.log(`- ${doc.id}: já existe em \`users\`, pulando`);
    pulados++;
    continue;
  }

  const novo = {
    name: antigo.name ?? '',
    email: antigo.email ?? '',
    role: CARGO_TO_ROLE[antigo.cargo] ?? 'Aguardando atribuição',
  };
  if (antigo.fotoUrl) novo.fotoUrl = antigo.fotoUrl;

  console.log(`- ${doc.id}: cargo="${antigo.cargo ?? '—'}" -> role="${novo.role}"${DRY_RUN ? ' (dry-run)' : ''}`);

  if (!DRY_RUN) await alvo.set(novo);
  migrados++;
}

console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}Concluído: ${migrados} migrado(s), ${pulados} pulado(s).`);
process.exit(0);
