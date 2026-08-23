# Projeto Integração - Asimov Jr.

## Objetivo
Desenvolvimento de um Sistema de Gestão Integrada (ERP) voltado para as necessidades de controle e comunicação interna da Asimov Jr. O projeto atua como um hub central definitivo para resolver gargalos operacionais, descentralização de dados estratégicos e ruídos de comunicação.

Este repositório contém o código do **Sistema Desktop** (Angular). O aplicativo Mobile (Flutter) é versionado em um [repositório separado](#).

## Tecnologias Utilizadas
O ecossistema do projeto foi construído utilizando tecnologias modernas e confiáveis:
*   **Frontend Desktop:** Angular
*   **Frontend Mobile:** Flutter
*   **Banco de Dados & Backend:** Firebase
*   **Prototipagem & UI/UX:** Figma
*   **Metodologia Ágil:** Scrum

## Funcionalidades Principais

O sistema possui controle de acessos (permissões) baseado em hierarquia (Membros, Gerentes e Diretores), garantindo a segurança das informações. O login é restrito a contas com o domínio `@asimovjr.com.br`.

### Sistema Desktop (Gestão Administrativa)
Focado no controle de gestão e cadastros completos:
*   **Home/Dashboard:** Visão geral dos KPIs estratégicos, metas do Portal BJ e andamento dos projetos.
*   **Gestão Financeira:** Controle de entradas, saídas, módulo de envio de Nota Fiscal (upload de PDF/imagem) e relatórios de fluxo de caixa (Restrito à Diretoria).
*   **Gestão de Projetos:** Cadastro, atribuição de membros, definição de prazos, valores e acompanhamento de status.
*   **Gestão de Pessoas:** Controle de status (Ativo/Inativo), cargos e hierarquia.
*   **Comunicação:** Calendário de eventos/entregas e Feed Social para atualizações corporativas.

###  Aplicativo Mobile (Comunicação e Operação)
Focado no uso diário e fortalecimento da cultura interna:
*   **Feed Social Interativo:** Criação de postagens em texto e interação (likes) entre os membros.
*   **Acompanhamento Rápido:** Visualização de KPIs na Home e acompanhamento de projetos.
*   **Calendário Integrado:** Visualização em agenda de reuniões e entregas.

##  Equipe Desenvolvedora
*   Isadora Eduarda Costa Franco — Desktop
*   Giovana Fróes e Silva — Desktop
*   Miguel Cortez Cavalcante — Mobile
*   Matheus Motta Soriano — Mobile
*   Ana Luísa Silva Alves — Mobile
*   Matheus Alcântara Pereira — Mobile

##  Como Executar o Projeto

### Pré-requisitos
Certifique-se de ter os seguintes ambientes instalados em sua máquina:
*   [Node.js](https://nodejs.org/) e [Angular CLI](https://angular.io/cli)
*   [Flutter SDK](https://flutter.dev/docs/get-started/install)
*   Conta configurada no Firebase com as credenciais do projeto.

### Rodando o ambiente Desktop (Angular)
```bash
# Clone o repositório Desktop
git clone <url-do-repositorio-desktop>

# Acesse a pasta do projeto
cd asimovjr-desktop

# Instale as dependências
npm install

# Execute o servidor local
ng serve
```

A aplicação ficará disponível em `http://localhost:4200/`.

### Rodando o ambiente Mobile (Flutter)
O código do Mobile está em um repositório separado. Consulte o README daquele repositório para as instruções de execução.

## Padrão de Commits e Branches
Para manter a comunicação clara entre os desenvolvedores, evitando retrabalho:
*   Utilize branches separadas por tela/funcionalidade (ex: `feature/login`, `feature/home`, `feature/perfil`).
*   Abra Pull Requests para a branch `main` e peça revisão de ao menos um colega antes do merge.
*   Escreva mensagens de commit objetivas (ex: `feat: adiciona validação de e-mail no login`).
