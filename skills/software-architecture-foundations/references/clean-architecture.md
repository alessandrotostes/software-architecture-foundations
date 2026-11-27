# Clean Architecture — Robert C. Martin

Síntese operacional das seis partes do livro: paradigmas, princípios de design (SOLID),
princípios de componentes, arquitetura, detalhes e empacotamento.

## 1. Por que arquitetura (caps. 1–2)

- Design e arquitetura são a mesma coisa em níveis diferentes de detalhe: um contínuo de decisões.
- **Meta:** minimizar o esforço humano para construir *e manter* o sistema. Se o custo de cada
  release cresce e a produtividade cai, o design está falhando.
- "Fazer bagunça é sempre mais lento do que ficar limpo" — a pressa gera a lentidão.
- **Dois valores:** comportamento (fazer o sistema funcionar) e estrutura (mantê-lo "soft",
  fácil de mudar). Um programa perfeito que não pode mudar se torna inútil; um programa que
  não funciona mas é fácil de mudar pode ser consertado. A estrutura é o valor maior.
- **Matriz de Eisenhower:** arquitetura é importante, raramente urgente; funcionalidades são
  urgentes, nem sempre importantes. Desenvolvedores têm o dever de lutar pela arquitetura.

## 2. Paradigmas (caps. 3–6) — cada um *retira* um poder

| Paradigma | Disciplina imposta | Consequência arquitetural |
|---|---|---|
| Estruturado | Sem `goto` direto | Decomposição funcional; provar falsidade com testes (Dijkstra: testes mostram presença, não ausência, de bugs) |
| Orientado a objetos | Sem ponteiros para funções soltos — polimorfismo seguro | **Inversão de dependência**: controle absoluto sobre a direção das dependências de código-fonte; plugins |
| Funcional | Sem atribuição (imutabilidade) | Problemas de concorrência vêm de variáveis mutáveis; segregue componentes imutáveis dos mutáveis; *event sourcing* |

O ponto do OO para arquitetura **não** é encapsulamento ou herança — é o polimorfismo que
permite apontar dependências de código-fonte contra o fluxo de controle.

## 3. SOLID — princípios no nível de módulo/classe (caps. 7–11)

### SRP — Princípio da Responsabilidade Única
- *"Um módulo deve ser responsável por um, e apenas um, ator."*
- Não é "fazer uma coisa só" (isso é para funções). É sobre **quem pede mudanças**.
- Sintomas: duplicação acidental (CFO e COO compartilham um cálculo e um quebra o outro);
  merges conflitantes entre equipes no mesmo arquivo.
- Remédios: separar dados de funções; classes distintas por ator; uma Façade para reunir.

### OCP — Princípio Aberto/Fechado
- *"Um artefato de software deve ser aberto para extensão, mas fechado para modificação."*
- Em arquitetura: separe o que muda por razões diferentes (SRP) e organize as dependências
  (DIP) para que componentes de nível mais alto fiquem protegidos de mudanças nos de nível
  mais baixo. Hierarquia de proteção: Interactor > Controller > Presenter > Views.
- Evite dependências transitivas: não dependa do que você não usa diretamente.

### LSP — Princípio da Substituição de Liskov
- Subtipos devem poder substituir seus tipos-base sem que o programa mude de comportamento.
- Clássico: Quadrado não é subtipo de Retângulo (mutável).
- Em arquitetura vale para interfaces e serviços REST: uma única implementação "especial"
  que exige `if (tipo == X)` polui o sistema com mecanismos extras.

### ISP — Princípio da Segregação de Interfaces
- Não force clientes a depender de coisas que não usam (métodos, módulos, frameworks).
- Depender de algo que carrega bagagem desnecessária causa recompilações, reimplantações e
  falhas inesperadas.

### DIP — Princípio da Inversão de Dependência
- Código de política (alto nível) não deve depender de detalhes; detalhes dependem de políticas.
- Regras práticas:
  - Não referencie classes concretas voláteis; referencie interfaces abstratas.
  - Não derive de classes concretas voláteis.
  - Não sobrescreva funções concretas.
  - Nunca mencione o nome de algo concreto e volátil.
- Concretos estáveis (ex.: `String` da biblioteca padrão) podem ser usados diretamente.
- Criação: use **Abstract Factory** para que o núcleo crie objetos sem conhecer concretos.
  A linha arquitetural separa o abstrato (núcleo) do concreto (Main e plugins).

## 4. Princípios de componentes (caps. 12–14)

Componente = unidade de implantação (jar, gem, DLL, pacote npm, módulo).

### Coesão — o que vai dentro
| Princípio | Enunciado | Tende a |
|---|---|---|
| **REP** — Reuse/Release Equivalence | A granularidade do reúso é a granularidade do release (versionado, com release notes) | Agrupar para reusuários |
| **CCP** — Common Closure | Reúna o que muda pelas mesmas razões e ao mesmo tempo; separe o que muda por razões diferentes (SRP para componentes) | Agrupar para mantenedores |
| **CRP** — Common Reuse | Não force usuários a depender do que não precisam (ISP para componentes) | Separar |

Tensão: REP e CCP incham componentes; CRP os divide. No início do projeto, privilegie CCP
(desenvolvibilidade); à medida que o projeto amadurece e é reusado, desloque para REP.

### Acoplamento — relações entre componentes
- **ADP — Dependências Acíclicas:** nenhum ciclo no grafo de dependências de componentes.
  Quebre ciclos com DIP (interface no componente que precisa dela) ou criando um novo componente
  do qual ambos dependem. A estrutura de componentes é um mapa de *buildability* e
  manutenibilidade — não se projeta top-down no início; evolui com o sistema.
- **SDP — Dependências Estáveis:** dependa na direção da estabilidade.
  `I = Fan-out / (Fan-in + Fan-out)`; I=0 máximo estável, I=1 máximo instável.
  O I de um componente deve ser maior que o I dos componentes dos quais ele depende.
- **SAP — Abstrações Estáveis:** um componente deve ser tão abstrato quanto é estável.
  `A = Na / Nc` (classes abstratas+interfaces / total de classes). Em TypeScript, veja a
  adaptação da métrica em `typescript-react.md`.
- **Sequência principal:** `D = |A + I − 1|`. Componentes perto de (I=0, A=0) caem na
  **Zona da Dor** (concretos e estáveis — difíceis de mudar; esquemas de banco são o exemplo
  clássico; aceitável só para coisas não voláteis, como a biblioteca `String`). Perto de (I=1, A=1) caem na **Zona da Inutilidade**
  (abstrações que ninguém usa). Monitore D ao longo dos releases.

## 5. Arquitetura (caps. 15–28)

### O que é (cap. 15)
- Arquitetura é a forma dada ao sistema para facilitar desenvolvimento, implantação, operação e
  manutenção. Seu propósito principal é suportar o ciclo de vida, não fazer o sistema funcionar.
- **Mantenha as opções abertas** pelo maior tempo possível: separe política de detalhe para
  adiar decisões sobre banco, servidor web, REST, injeção de dependência, framework.
- Independência de dispositivo: o núcleo não sabe para onde vai a saída.

### Independência (cap. 16)
- Suporte: casos de uso (a arquitetura deve deixar claros os casos de uso), operação
  (escala, vazão), desenvolvimento (equipes independentes — Lei de Conway), implantação
  (implantação imediata após o build).
- **Desacople camadas horizontais** (UI, regras específicas da app, regras de negócio, banco)
  e **casos de uso verticais** (adicionar pedido vs. remover pedido).
- **Duplicação verdadeira vs. acidental:** duas telas parecidas que mudam por razões diferentes
  NÃO devem ser unificadas. Não passe registros do banco diretamente para a UI.
- **Modos de desacoplamento:** nível de código-fonte (monólito modular), nível de implantação
  (DLLs/jars independentes), nível de serviço. Bons arquitetos permitem migrar entre eles;
  comece no nível de fonte e promova quando necessário.

### Fronteiras (caps. 17–18)
- Desenhe linhas entre coisas que importam e coisas que não importam. A GUI não importa para
  as regras de negócio; o banco não importa para a GUI nem para as regras.
- **Plugin architecture:** banco e UI são plugins do núcleo. As setas cruzam a fronteira
  apontando para o núcleo.
- Anatomia: chamadas de função no mesmo processo (monólito), componentes implantáveis,
  threads, processos locais, serviços. Em todas, a regra é a mesma: o lado de baixo nível
  depende do lado de alto nível.

### Política e nível (cap. 19)
- **Nível** = distância das entradas e saídas. Quanto mais longe do I/O, mais alto o nível.
- Políticas que mudam pelas mesmas razões e no mesmo ritmo ficam no mesmo componente.
- Dependências de código-fonte devem ser desacopladas do fluxo de dados e acopladas ao nível.

### Regras de negócio (cap. 20)
- **Entidade:** dados críticos + regras críticas de negócio; existiria mesmo sem computador.
  Objeto puro, sem dependência de banco, UI ou framework.
- **Caso de uso:** regra específica da aplicação — entrada, passos de processamento, saída.
  Conhece entidades; entidades não conhecem casos de uso.
- **Modelos de requisição/resposta:** estruturas de dados simples e independentes; não passe
  entidades nem objetos do framework (ex.: `HttpRequest`) através da fronteira.

### Arquitetura que grita (cap. 21)
- A estrutura de pastas e módulos deve gritar o domínio ("Sistema de Saúde", "Contabilidade"),
  não o framework ("Rails", "Spring"). Frameworks são ferramentas, não arquiteturas.
- Deve ser possível testar todos os casos de uso sem o framework, servidor web ou banco.

### A Arquitetura Limpa (cap. 22)
Círculos concêntricos, de dentro para fora:
1. **Entidades** — regras de negócio corporativas.
2. **Casos de uso** — regras de negócio da aplicação; orquestram o fluxo de dados para/das entidades.
3. **Adaptadores de interface** — controllers, presenters, gateways; convertem dados entre o
   formato conveniente aos casos de uso e o formato conveniente ao exterior (web, banco).
4. **Frameworks e drivers** — web, banco, dispositivos, UI externa. "Cola" mínima.

**Regra da Dependência:** dependências de código-fonte apontam apenas para dentro.
Para cruzar fronteiras contra o fluxo de controle (caso de uso → presenter), use DIP: o caso de
uso chama uma *output port* (interface no círculo interno) implementada pelo presenter.
Dados que cruzam fronteiras são estruturas simples (DTOs), no formato mais conveniente ao círculo interno.

Arquiteturas equivalentes: Hexagonal (Ports & Adapters), DCI, BCE, Onion.

### Presenters e Humble Objects (cap. 23)
- **Humble Object:** divida o comportamento em dois módulos — um "humilde" (difícil de testar,
  mínimo, ex.: View que só copia dados do ViewModel para a tela) e outro testável (Presenter
  que formata tudo em strings/flags no ViewModel).
- Aparece em toda fronteira: gateways de banco (interface no núcleo, implementação SQL fora),
  ORMs (pertencem à camada de banco), listeners de serviço.

### Fronteiras parciais (cap. 24)
Fronteiras completas são caras. Alternativas quando ainda não se pagam (YAGNI vs. antecipação):
- **Pular o último passo:** separar em componentes, mas compilar/implantar juntos.
- **Fronteira unidimensional:** só a interface do lado do núcleo (Strategy).
- **Façade:** abre mão até da inversão de dependência; mais barato, mais frágil.
Documente a escolha e reavalie quando a pressão aumentar.

### Camadas e fronteiras (cap. 25)
- Fronteiras podem existir em vários eixos (UI, idioma, mecanismo de comunicação, persistência).
- O arquiteto observa o sistema evoluir, nota onde fronteiras podem ser necessárias e pesa
  custo de implementá-las agora versus custo de ignorá-las e adicionar depois.

### O componente Main (cap. 26)
- Main é o detalhe mais sujo: cria fábricas, estratégias, configura e injeta tudo, e então
  passa o controle para as políticas abstratas. É um plugin da aplicação.
- Pode haver vários Mains (dev, teste, produção; por país/cliente).

### Serviços grandes e pequenos (cap. 27)
- Serviços não são, por si só, arquitetura. São chamadas de função caras através de processos.
- **Falácia do desacoplamento:** serviços podem estar fortemente acoplados por dados compartilhados.
- **Falácia do desenvolvimento/implantação independentes:** nem sempre; um novo campo pode exigir
  mudar todos os serviços.
- **Problema do gato (kitty problem):** funcionalidades transversais atravessam todos os serviços.
  Solução: serviços internamente estruturados em componentes que seguem a Regra da Dependência
  (componentes-plugin, templates, OCP dentro de cada serviço).
- A arquitetura é definida pelas fronteiras *dentro* e *entre* serviços, não pelos serviços em si.

### A fronteira de teste (cap. 28)
- Testes são parte do sistema — o círculo mais externo. Nada depende deles; eles dependem do sistema.
- **Problema dos testes frágeis:** testes fortemente acoplados (ex.: via GUI ou estrutura de classes)
  quebram com qualquer mudança. Regra: não dependa de coisas voláteis.
- **API de teste:** uma API específica para testes, que pode contornar segurança e recursos caros,
  esconde a estrutura da aplicação e permite que a estrutura e os testes evoluam independentemente.
  Não implante as partes perigosas dela em produção.

### Arquitetura limpa embarcada (cap. 29)
- Software não deveria "endurecer" em firmware. Isole o hardware com uma HAL (camada de abstração
  de hardware) e o SO com uma OSAL; teste fora do alvo (*off-target*).

## 6. Detalhes (caps. 30–32)

- **O banco de dados é um detalhe.** Os dados são importantes; o modelo de dados importa; a
  tecnologia de armazenamento (relacional, documentos, arquivos) é um mecanismo de baixo nível.
  Não deixe estruturas de linhas/tabelas vazarem pela arquitetura.
- **A web é um detalhe.** É um mecanismo de I/O; o pêndulo cliente/servidor oscila. A GUI é um
  detalhe; desacople a lógica de negócio dela.
- **Frameworks são detalhes. "Não case com o framework."** O autor do framework não se importa
  com você; o casamento é assimétrico. Mantenha-o atrás de uma fronteira, como plugin;
  não derive suas entidades das classes base do framework. Exceções aceitáveis: biblioteca
  padrão da linguagem e alguns frameworks verdadeiramente estáveis — mas decida conscientemente.

## 7. Estudo de caso e "capítulo que faltava" (caps. 33–34)

- Particione por **atores** e **casos de uso**, depois aplique a Regra da Dependência em cada eixo.
- Formas de empacotar:
  - **Por camada** (web / service / repository): simples para começar, não grita o domínio.
  - **Por funcionalidade** (orders/, …): agrupa vertical, ainda pode vazar.
  - **Portas e adaptadores**: domínio dentro, infraestrutura fora.
  - **Por componente:** agrupa a lógica de negócio e a persistência de um recurso atrás de uma
    interface pública; controllers dependem do componente, não do repositório.
- **O diabo está nos detalhes de implementação:** use os modificadores de acesso (`internal`,
  pacotes privados, módulos) e o compilador para *impor* a arquitetura. Se tudo for `public`,
  as camadas são apenas organização visual. Considere ferramentas de checagem de arquitetura
  (ex.: ArchUnit, dependency-cruiser, import-linter) e builds de módulos separados.
- Busque "módulos separados por compilação" para o núcleo não conseguir sequer importar a infraestrutura.

## Checklist rápido Clean Architecture

- [ ] Consigo nomear os atores e mapeá-los a módulos?
- [ ] Entidades e casos de uso não importam nada de framework/banco/web?
- [ ] Interfaces de saída (repositórios, gateways, presenters) estão definidas no núcleo?
- [ ] DTOs simples cruzam fronteiras; entidades e objetos de framework não?
- [ ] Main/composição é o único lugar que conhece todos os concretos?
- [ ] Grafo de componentes acíclico; I decrescendo na direção das dependências?
- [ ] Testes de casos de uso rodam em memória, sem infraestrutura?
- [ ] A visibilidade (público/privado/interno) reforça as fronteiras?
