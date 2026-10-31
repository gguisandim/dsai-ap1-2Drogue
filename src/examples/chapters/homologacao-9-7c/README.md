# Homologação 9.7C

Capítulo gerado a partir do template oficial da Etapa 9.7A.

- **Namespace:** `authoring.homologacao.demo`
- **Chapter ID:** `chapter.authoring.homologacao.demo`
- **Stage ID:** `stage.authoring.homologacao.demo.approach`
- **Revisão:** 1
- **Diretório:** `src/examples/chapters/homologacao-9-7c`
- **Slug:** `homologacao-9-7c`

## Identidades estáveis

| Campo | ID |
|---|---|
| Chapter ID | `chapter.authoring.homologacao.demo` |
| Stage ID | `stage.authoring.homologacao.demo.approach` |
| NPC ID | `npc.authoring.homologacao.demo.warden` |
| Dialogue ID | `dialogue.authoring.homologacao.demo.warden` |
| Mission ID | `mission.authoring.homologacao.demo.relight` |
| Objective ID | `objective.authoring.homologacao.demo.encounter` |
| Encounter ID | `encounter.authoring.homologacao.demo.beacon` |
| Exit ID | `exit.authoring.homologacao.demo.depart` |
| Region ID | `region.authoring.homologacao.demo` |
| Reward operation | `operation.authoring.homologacao.demo.light` |
| Flag arrived | `flag.authoring.homologacao.demo.arrived` |
| Flag accepted | `flag.authoring.homologacao.demo.accepted` |
| Flag beacon lit | `flag.authoring.homologacao.demo.beacon-lit` |
| Event arrival | `event.authoring.homologacao.demo.arrival` |
| Event warden | `event.authoring.homologacao.demo.warden` |
| Event beacon lit | `event.authoring.homologacao.demo.beacon-lit` |
| Event depart | `event.authoring.homologacao.demo.depart` |
| Visual theme | `theme.authoring.homologacao.demo` |
| Visual tileset | `tileset.authoring.homologacao.demo` |
| NPC presentation | `presentation.authoring.homologacao.demo.warden` |
| Audio profile | `audio-profile.authoring.homologacao.demo` |
| Environment | `environment.authoring.homologacao.demo` |

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `ids.ts` | constantes de identidade derivadas do namespace |
| `level.ts` | mapa autoral, spawn, item e decoração |
| `presentation.ts` | recursos visuais e de áudio |
| `encounter.ts` | encontro declarativo |
| `narrative.ts` | NPC, diálogo, missão, eventos e flags |
| `stage.ts` | `StageModule` completo |
| `chapter.ts` | `ChapterManifest` |
| `registration.ts` | entrada do catálogo e registry isolado |
| `template.ts` | factory local reutilizável |
| `index.ts` | exports e instância do capítulo |
| `AUTHORING.md` | guia de autoria copiado do template |

## Editar

1. Ajuste títulos e textos em `narrative.ts`, `stage.ts` e `chapter.ts`.
2. Ajuste o mapa em `level.ts`, mantendo borda fechada, spawn e saída alcançável.
3. Ajuste o encontro em `encounter.ts` usando arquétipos existentes.
4. Ajuste tema, tileset, sprites e áudio em `presentation.ts`.
5. Se alterar IDs, mantenha `ids.ts` e os arquivos de conteúdo coerentes.
6. Não edite o template original em `src/examples/chapter-template/`.

## Validar e inspecionar

```sh
npm run chapter -- validate homologacao-9-7c
npm run chapter -- inspect homologacao-9-7c
npm run chapter -- inspect homologacao-9-7c --json
npm run chapter -- preview homologacao-9-7c
npm run chapter -- preview homologacao-9-7c --visual
```

## Registro

O capítulo **não** está no catálogo de produção. Para usá-lo em testes ou em um
bootstrap de desenvolvimento, use `registration.ts`:

```ts
import { createChapterTemplateRegistry } from '.';
const registry = createChapterTemplateRegistry(CHAPTER_TEMPLATE.entry);
```

O modo individual pode ser acionado com
`new GameSessionService({ registry }).startIndividualStage('stage.authoring.homologacao.demo.approach')`.
O World Lab aceita o mesmo registry injetado.

`preview` sem opções é headless: valida, carrega no modo individual e projeta no
World Lab, mas não renderiza com Phaser.

`preview homologacao-9-7c --visual` prepara o preview real. Ele exige que o capítulo
esteja no diretório canônico `src/examples/chapters/`, imprime a URL
`http://localhost:5173/?chapterPreview=homologacao-9-7c` e explica o bootstrap. Inicie
`npm run dev` e abra a URL. O bootstrap do Vite descobre capítulos por
`import.meta.glob`, cria um `StageRegistry` isolado, valida o capítulo e inicia
uma sessão individual na `GameScene`. O catálogo de produção e o save da
campanha principal não são alterados.
