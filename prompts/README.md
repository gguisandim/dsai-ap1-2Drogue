# Arquivo de prompts

`prompts/sessoes/` é a fonte de verdade. Os JSONL são cópias byte a byte das sessões locais do Codex associadas a este repositório. A sessão cujo gzip ainda ultrapassava o limite do Git foi dividida em partes gzip; a concatenação dos conteúdos descompactados, na ordem numérica, recompõe exatamente o JSONL original. O manifesto registra tamanhos e hashes SHA-256.

O arquivo `registro-completo.md` é um índice legível gerado a partir das mensagens humanas das sessões principais. Contextos automáticos (`environment_context`, página aberta, instruções do ambiente) e prompts internos de subagentes continuam preservados nos JSONL, mas não são atribuídos ao autor nem duplicados no índice.

O arquivo `2026-10-06-1628-copia-manual-codex.txt` preserva exatamente a cópia parcial fornecida em `C:\Users\David\Desktop\prompts pro jogo.txt`. Ela serve como evidência adicional e não substitui os JSONL.

## Ferramenta e modelo

- Ferramenta: Codex, extensão do VS Code.
- Modelo informado pelo autor: Codex 5.6, raciocínio alto.
- Metadado técnico confirmado nas sessões: `gpt-5.6-sol`, esforço `high`.

## Cobertura e imutabilidade

A sessão bruta mais antiga encontrada localmente para este repositório começa em 2026-10-02 14:36. O primeiro prompt dessa sessão já contém contexto de uma conversa anterior colado pelo autor. Nenhuma exportação bruta anterior vinculada a este repositório foi localizada; por isso, textos ausentes não foram inventados nem reconstruídos.

Arquivos já arquivados não devem ser reescritos. Ao terminar uma nova sessão, adicione outra exportação com o padrão `AAAA-MM-DD-HHMM-ferramenta.ext`. Ajustes futuros no índice devem entrar em novo commit, mantendo o histórico do Git.

## Registros v1 de novos trabalhos

Novos trabalhos assistidos também recebem um registro Markdown aditivo baseado
em [`MODELO-REGISTRO.md`](./MODELO-REGISTRO.md), com schema
`umbra-prompt-record/v1`. Esse registro preserva o prompt efetivamente recebido e
o associa à SPEC, aos arquivos modificados, às validações e ao commit. Ele não
substitui uma exportação bruta disponível nem transforma os prompts propostos
01–08 em evidência de execução.

Dados não confirmados são registrados como `desconhecido` ou `pendente`. Em
especial, não se infere modelo, esforço, sessão ou commit a partir do conteúdo do
pedido. Os arquivos históricos permanecem aceitos como legado pelo gate e não
devem ser editados retroativamente.

Validação local:

```powershell
npm run check:traceability
```

## Segurança antes de cada commit

Execute:

```powershell
.\scripts\auditar-segredos-prompts.ps1 prompts\sessoes
```

O script não imprime o valor encontrado; informa somente arquivo, linha e tipo provável. Se houver uma credencial real, revogue-a antes de versionar. Apagar ou mascarar o texto não torna uma chave exposta segura.
