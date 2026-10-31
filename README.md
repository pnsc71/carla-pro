# CARLA PRO 4.0 — primeira versão para iPhone

Aplicação web instalável, responsiva e **apenas de consulta**. O código do Mac e o XANITO não foram alterados. Todos os alunos, datas e valores desta aplicação são exemplos inventados. Não são exportações da Carla.

## Estado

- Painel com quatro cartões, painéis presencial/online, modo claro/escuro e ocultação de valores.
- Consulta de aulas por mês/modalidade/aluno; alunos e preços fictícios; sem operações de edição.
- OAuth Google Identity Services com a credencial **Web existente**, sem Client Secret.
- Access tokens apenas em memória; logout, revogação e expiração tratados. Reentrar após fechar/recarregar é esperado.
- Autorização incremental `drive.file` disponível em Definições após autenticar. A leitura de ficheiros está **bloqueada no código**, independentemente do consentimento.
- Manifest, ícones para iPhone e service worker com cache limitado à aplicação e exemplos públicos. Não guarda respostas Google, tokens ou ficheiros privados.
- A demonstração pode ser aberta sem Google porque contém apenas dados fictícios públicos. Não é uma forma de proteger dados reais num site público.

## Testar no computador

Requer Node.js 22+ e Python 3 para o servidor de desenvolvimento. Não requer instalação de pacotes.

```sh
npm test
npm run preview
```

Abrir `http://localhost:8514/`. A interface funciona sem OAuth através de **Ver demonstração fictícia**.

## Publicar em pnsc71/carla-pro

O código de publicação está todo em `docs/`. Nunca publicar a pasta do programa do Mac.

1. Enviar estes ficheiros para o repositório `pnsc71/carla-pro`, preservando as pastas.
2. Em **Settings → Pages → Build and deployment → Source**, selecionar **GitHub Actions**.
3. O workflow `pages.yml` executa os testes e publica apenas `docs/` quando há alterações em `main`.
4. Confirmar o sucesso no separador Actions.
5. Abrir `https://pnsc71.github.io/carla-pro/`.

## Configurar a Google sem alterar o XANITO

A aplicação usa o Client ID Web público que foi fornecido, em `docs/config.js`. O ID não é segredo. Não copiar qualquer Client Secret para este repositório.

No projeto Google Cloud XANITO, confirmar a credencial Web correspondente:

- Origem JavaScript autorizada para produção: **`https://pnsc71.github.io`** (sem `/carla-pro/`).
- Para teste local, acrescentar **`http://localhost:8514`**, se desejado.
- Preservar todas as origens e os redirecionamentos existentes do XANITO. Não mudar o tipo da credencial.
- Este fluxo GIS usa uma janela OAuth, sem endpoint próprio de callback e sem Client Secret.
- Se o ecrã de consentimento estiver em teste, incluir a conta usada como utilizador de teste. Não divulgar a conta no repositório.
- Para autorizar `drive.file`, confirmar que a Drive API está ativa e o âmbito está declarado no consentimento.
- Google Picker só será necessário na fase de leitura. Ainda não é carregado nem usado; a leitura está bloqueada até validar o método entre dispositivos.

Não foram efetuadas alterações ao projeto Cloud nesta entrega. Uma origem não autorizada pode provocar `origin_mismatch`; não é resolvido adicionando segredos ao código.

## Testar no iPhone

1. Depois de o Pages publicar, abrir **Safari** em `https://pnsc71.github.io/carla-pro/`.
2. Tocar em **Ver demonstração fictícia**. Confirmar cartões, meses, filtros e alunos. Não existem botões para guardar ou editar aulas.
3. Alternar o tema em cima; testar ocultar valores. Rodar o iPhone para verificar a disposição.
4. Para OAuth, tocar em **Entrar com Google** e concluir a escolha de conta e consentimento. Não permitir janelas bloqueadas apenas se o Safari efetivamente as bloquear para este início de sessão.
5. Confirmar a mensagem de sessão ligada. A aplicação continua com dados fictícios.
6. Em Definições, testar a autorização `drive.file`, caso esteja configurada. A aplicação confirma a permissão sem ler ficheiros. Terminar sessão e voltar a entrar.
7. No Safari, tocar **Partilhar → Adicionar ao ecrã principal** (e “Abrir como aplicação web”, se essa opção aparecer). Abrir pelo novo ícone.
8. Repetir o início de sessão na aplicação instalada: é um contexto separado e este teste num iPhone físico ainda é necessário.
9. Após uma visita online, os exemplos podem ser vistos offline. O login Google exige Internet.

## Mesmo ficheiro privado no Mac e iPhone — decisão antes da leitura

Ver [DRIVE-PLAN.md](DRIVE-PLAN.md). `drive.file` não dá acesso a todos os ficheiros da conta, e conhecer um `fileId` não basta. Não haverá leitura de ficheiros reais nesta fase.

## Privacidade e segurança

O Pages aloja apenas o programa e exemplos públicos. OAuth não torna privados os ficheiros incluídos no GitHub. Não acrescentar SQLite, contactos, exportações reais, tokens ou segredos ao repositório. A foto pessoal da Carla também não foi copiada: os ícones desta versão foram desenhados para o teste.

O `drive.file` permite leitura **e gestão** dos ficheiros autorizados; não existe aqui uma promessa de permissão Google estritamente só de leitura. A aplicação só de consulta é garantida pela ausência de operações de escrita; a leitura privada está ainda bloqueada.

Testes automatizados cobrem cálculos/filtros, meses, dados fictícios, OAuth simulado, expiração/logout/recusa de âmbito, bloqueio de leitura e limites do cache. OAuth real, configuração Cloud, publicação e instalação num iPhone exigem verificação com os serviços/dispositivo.
