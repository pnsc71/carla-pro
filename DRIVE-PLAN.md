# Decisão de acesso ao mesmo ficheiro privado

## Resultado da verificação documental

**É viável**, sob condições explícitas. `drive.file` permite aceder apenas a ficheiros criados pela aplicação ou explicitamente escolhidos pelo utilizador (normalmente com Google Picker). O mesmo Drive, a mesma pasta ou apenas um ID não concedem essa autorização.

O método proposto para a fase seguinte é um **JSON privado de consulta**, com identificador estável, servido pela Drive API autenticada. Não publicar nem partilhar o ficheiro como “qualquer pessoa com ligação”. Não usar SQLite em sincronização entre clientes.

## Duas formas de testar no Mac sem alterar o programa atual

1. Abrir a **mesma aplicação web**, com a mesma credencial Web e conta Google, no navegador do Mac e no iPhone. Selecionar explicitamente o mesmo JSON fictício através de Picker em ambos. O `setAppId` do Picker corresponde ao projeto Cloud `351066093391`. O ficheiro permanece privado.
2. Se futuramente houver um exportador Python independente, usar uma credencial **Desktop** do mesmo projeto, com o seu próprio consentimento. Nunca reutilizar a credencial Web como se fosse Desktop. Não assumir que a autorização de um cliente ou de uma conta automaticamente autoriza o outro: comprovar `files.get` com `drive.file` em cada um, escolhendo/abrindo o mesmo ficheiro quando necessário.

A opção 1 confirma a consulta do mesmo ficheiro em dois dispositivos sem mexer no Streamlit. A sincronização automática a partir dos dados SQLite do Mac é **uma fase posterior não implementada nem autorizada nesta entrega**.

## Prova obrigatória antes de ativar leitura

- Criar manualmente um JSON com dados exclusivamente fictícios numa conta de teste; sem contactos.
- Ambos os contextos usam a conta proprietária, ou contas às quais o proprietário deu acesso normal ao ficheiro (a autorização Drive não substitui a partilha entre pessoas).
- Configurar Drive API e Google Picker API, uma chave de Picker restrita às APIs e referências recomendadas pela Google, e o `setAppId` correto. Nenhuma chave de Picker é necessária nesta fase, pois Picker e leitura não estão implementados.
- Escolher o mesmo ficheiro via Picker no Mac e iPhone, guardar apenas o respetivo ID para a sessão, nunca um token no código ou no GitHub.
- Com os tokens independentes de cada dispositivo, obter os metadados `id`, `version` e `modifiedTime`, e ler o conteúdo por `files.get?alt=media`.
- Comparar o mesmo `id` e conteúdo/versão. Alterar apenas um valor fictício no ficheiro de teste e confirmar que ambos veem a atualização ao atualizar a consulta.
- Revogar a autorização e verificar falha controlada; validar também outra conta sem acesso. Não alargar para `drive` ou `drive.readonly` para contornar uma falha.
- Só após este ensaio ativar uma leitura limitada a um esquema JSON validado. Não existe API de escrita nesta aplicação.

**Estado atual: método confirmado documentalmente; prova prática pendente; leitura desativada.** Não foi contactado qualquer ficheiro do Drive, nem alterado o Mac ou XANITO.

## Fontes oficiais consultadas

- [Âmbitos e restrições de drive.file](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Google Picker, autorização explícita e setAppId](https://developers.google.com/workspace/drive/picker/guides/web-picker)
- [Modelo OAuth GIS no navegador, sem Client Secret](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Leitura autenticada com files.get e alt=media](https://developers.google.com/workspace/drive/api/guides/manage-downloads)
