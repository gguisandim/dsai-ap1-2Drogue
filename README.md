# Umbra Trail

Roguelike 2D em pixel art com personagens personalizáveis, classes, combate por armas e especiais, fases procedurais, progressão e bestiário.

## Equipe

| Integrante | GitHub |
|---|---|
| David Tavares | [@sayydaviid](https://github.com/sayydaviid) |
| João Gonçalves | [@IcsPingu](https://github.com/IcsPingu) |

Ritmo de desenvolvimento declarado pela dupla: **4 horas por dia**.

## Jogar

### [▶ Abrir Umbra Trail no navegador](https://icspingu.github.io/dsai-ap1-2Drogue/)

A publicação da `main` é automatizada pelo workflow [Publicar jogo no GitHub Pages](./.github/workflows/publicar-pages.yml).

## Ferramentas e modelo

| Finalidade | Ferramenta | Modelo ou versão |
|---|---|---|
| Desenvolvimento assistido | Codex, extensão do VS Code | Codex 5.6; identificador `gpt-5.6-sol`; raciocínio alto (`high`) |
| Engine | Phaser | 3.70 |
| Linguagem | TypeScript | 5.4 |
| Build e servidor local | Vite | 5.2 |
| Testes | Jest e ts-jest | 29.7 e 29.1 |
| Versionamento | Git e GitHub | histórico na branch `main` |
| Contagem de código | cloc | 2.10 |

O [registro legível](./prompts/registro-completo.md) associa cada prompt humano à ferramenta, ao modelo e à sessão bruta correspondente.

## Contagem de código

Comando solicitado para a conferência:

```sh
cloc . --vcs=git \
  --exclude-dir=node_modules,vendor,dist,build,prompts \
  --exclude-lang=Markdown,JSON,YAML,CSV,Text,SVG \
  --not-match-f='(lock|\.min\.)'
```

Saída obtida em 2026-10-06 com o `cloc` 2.10:

```text
github.com/AlDanial/cloc v 2.10  T=3.65 s (438.9 files/s, 57878.7 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                    1594          11683           2227         185407
JavaScript                       8           1282              4          10810
PowerShell                       1              9              0             74
HTML                             1              0              1             11
-------------------------------------------------------------------------------
SUM:                          1604          12974           2232         196302
-------------------------------------------------------------------------------
```

Total considerado: **196.302 linhas de código**.

Separação exigida para a apresentação:

| Categoria | Linhas de código |
|---|---:|
| Testes em `src/tests/` | 2.261 |
| Demais códigos versionados | 194.041 |
| **Total** | **196.302** |

## Números da apresentação

| Métrica | Valor |
|---|---:|
| Specs datadas | 23 |
| Prompts humanos indexados | 36 |
| Sessões do Codex preservadas | 14 |
| Suítes de teste | 15 |
| Testes automatizados | 518 |
| Ritmo de desenvolvimento | 4 horas por dia |

## Especificações e rastreabilidade

- [Índice de especificações](./SPEC/README.md)
- [Arquitetura de campanha narrativa modular](./SPEC/2026-10-27-arquitetura-campanha-modular.md)
- [Spec desta entrega](./SPEC/2026-10-06-entrega-documentacao-deploy.md)
- [Registro completo de prompts](./prompts/registro-completo.md)
- [Manifesto das sessões brutas](./prompts/sessoes/MANIFESTO.md)

Novos commits assistidos seguem este formato de trailers:

```text
Agent: Codex 5.6 (alto)
Spec: SPEC/AAAA-MM-DD-parte.md
```

## Segurança

Antes de cada commit, as exportações e os arquivos versionados são verificados por [`scripts/auditar-segredos-prompts.ps1`](./scripts/auditar-segredos-prompts.ps1). A auditoria desta entrega examinou 1.704 arquivos e não encontrou chaves conhecidas, tokens, senhas, chaves privadas ou arquivos `.env` versionados.

Uma credencial encontrada deve ser revogada antes do commit; apenas apagar ou mascarar o valor não a torna segura.

## Executar localmente

```sh
npm install
npm run dev
```

Validação completa:

```sh
npm run build
npm test -- --runInBand
```

## Controles

| Ação | Controle |
|---|---|
| Movimento | `WASD` ou setas |
| Mirar | mouse |
| Ataque primário | botão esquerdo |
| Especial/ultimate | botão direito |
| Esquiva | `Espaço` |
| Loja | `B` |
| Menu | `Esc` |
