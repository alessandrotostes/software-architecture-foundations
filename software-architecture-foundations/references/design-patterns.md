# Padrões de Projeto — Gamma, Helm, Johnson, Vlissides (GoF)

Os 23 padrões do catálogo GoF são soluções com nome para problemas recorrentes de design orientado a objetos.
As intenções abaixo estão descritas com palavras próprias, não citadas do livro.
Cada padrão deixa **um aspecto do sistema variar independentemente** dos outros.

## 1. Princípios do capítulo 1

- **Programe para uma interface, não para uma implementação.** Declare variáveis com tipos
  abstratos; clientes não conhecem as classes concretas. Padrões de criação existem para
  manter isso ao instanciar.
- **Prefira composição de objetos à herança de classe.** Herança é reúso "caixa-branca",
  estático, quebra o encapsulamento (a subclasse depende de detalhes da mãe). Composição é
  reúso "caixa-preta", dinâmico, mantém classes pequenas e focadas.
  Custo: mais objetos, design menos óbvio de ler.
- **Delegação** torna a composição tão poderosa quanto a herança (o receptor repassa ao delegado).
- **Encapsule o conceito que varia** — tema comum de muitos padrões.
- **Granularidade, interfaces e tipos:** o tipo de um objeto é sua interface; a classe é sua
  implementação. Distinga herança de classe (reúso de implementação) de herança de interface (subtipagem).
- Distinga **agregação** (ciclo de vida compartilhado, "é parte de") de **associação/conhecimento**
  (apenas conhece). Estruturas em tempo de execução diferem das de compilação.
- **Não aplique indiscriminadamente:** padrões adicionam indireção, complexidade e às vezes
  custo de desempenho. Aplique **somente quando a flexibilidade for realmente necessária**.
  A seção *Consequências* de cada padrão é onde se avalia custo × benefício.

## 2. As 8 causas comuns de reprojeto → padrões que as evitam

| # | Causa | Padrões |
|---|---|---|
| 1 | Criar objetos especificando explicitamente a classe concreta | Abstract Factory, Factory Method, Prototype |
| 2 | Dependência de operações específicas (pedido codificado rigidamente) | Chain of Responsibility, Command |
| 3 | Dependência de plataforma de hardware/software | Abstract Factory, Bridge |
| 4 | Dependência de representações ou implementações de objetos | Abstract Factory, Bridge, Memento, Proxy |
| 5 | Dependências algorítmicas | Builder, Iterator, Strategy, Template Method, Visitor |
| 6 | Acoplamento forte | Abstract Factory, Bridge, Chain of Responsibility, Command, Façade, Mediator, Observer |
| 7 | Estender funcionalidade via subclasses (explosão de classes) | Bridge, Chain of Responsibility, Composite, Decorator, Observer, Strategy |
| 8 | Incapacidade de alterar classes convenientemente (sem fonte, ou mudança afeta muitas subclasses) | Adapter, Decorator, Visitor |

## 3. Como selecionar e usar um padrão (seções 1.7–1.8)

Seleção: (1) considere como padrões resolvem problemas de design; (2) leia as *Intenções*;
(3) estude inter-relações; (4) compare padrões de propósito similar; (5) examine as causas de
reprojeto acima; (6) **pergunte o que deve variar** sem reprojetar (tabela abaixo).

Uso: leia o padrão inteiro (especialmente *Aplicabilidade* e *Consequências*); estude
estrutura, participantes e colaborações; veja código de exemplo; **dê nomes do domínio**
aos participantes incorporando o nome do papel (ex.: `TaxCalculationStrategy`); defina
classes, interfaces e operações; implemente.

## 4. Catálogo — intenção, o que varia, quando usar, custo

### Padrões de criação
Abstraem a instanciação. Tornam o sistema independente de como objetos são criados, compostos e representados.

| Padrão | Intenção | O que pode variar | Use quando | Custo / alternativa simples |
|---|---|---|---|---|
| **Abstract Factory** | Ponto único que fabrica conjuntos de objetos que precisam combinar entre si, sem o cliente saber quais classes concretas saem dali | Famílias de produtos | Várias famílias intercambiáveis (temas de UI, provedores de nuvem); garantir consistência entre produtos | Adicionar novo *tipo* de produto exige mudar a interface. Alternativa: função fábrica simples |
| **Builder** | Monta um objeto complexo em etapas; a mesma sequência de montagem pode gerar resultados diferentes | Como um objeto composto é criado | Construção passo a passo, muitos parâmetros opcionais, objetos imutáveis | Classe extra. Alternativa: parâmetros nomeados / literais de objeto |
| **Factory Method** | Delega a uma subclasse (ou a uma função injetada) a escolha de qual objeto concreto criar | Subclasse que é instanciada | Framework que precisa criar objetos da aplicação; ganchos de extensão | Força subclasse só para criar. Alternativa: injetar uma função/fábrica |
| **Prototype** | Gera objetos novos clonando um exemplar já configurado | Classe instanciada | Classes definidas em runtime; configurações pré-montadas; evitar hierarquia paralela de fábricas | Clonagem profunda/ciclos é difícil |
| **Singleton** | Restringe a classe a um só objeto e o expõe para o sistema inteiro | A única instância | Recurso realmente único (raro) | **Estado global**: acoplamento oculto, dificulta testes. Prefira uma instância única criada no Main e injetada |

### Padrões estruturais
Compõem classes e objetos para formar estruturas maiores.

| Padrão | Intenção | O que pode variar | Use quando | Custo / alternativa simples |
|---|---|---|---|---|
| **Adapter** | Coloca um tradutor entre um componente e quem o usa, convertendo uma interface incompatível na esperada | Interface de um objeto | Integrar biblioteca/legado/serviço externo; **anticorrupção nas fronteiras** | Uma camada extra; mantenha-o fino |
| **Bridge** | Divide um conceito em duas hierarquias — o que ele é e como é implementado — que evoluem separadas | Implementação de um objeto | Duas dimensões de variação que causariam explosão de subclasses (forma × renderizador) | Mais indireção; projetar cedo |
| **Composite** | Organiza objetos em árvore e deixa o cliente tratar um item isolado e um grupo de itens do mesmo jeito | Estrutura e composição | Hierarquias (menus, documentos, expressões, organizações) | Interface genérica demais pode permitir operações sem sentido em folhas |
| **Decorator** | Embrulha um objeto para somar comportamento em tempo de execução, sem criar subclasses | Responsabilidades sem subclasses | Comportamentos combináveis (cache, log, retry, compressão, autorização) — *middleware* | Muitos objetos pequenos; identidade do objeto muda; depuração |
| **Façade** | Oferece uma porta de entrada simples para um conjunto complicado de classes | Interface para um subsistema | Simplificar uso de subsistema complexo; reduzir acoplamento cliente-subsistema; fronteira parcial | Pode virar "god object" se acumular lógica |
| **Flyweight** | Reaproveita a parte comum de objetos muito numerosos para economizar memória | Custo de armazenamento | Milhões de objetos com estado intrínseco compartilhável (glifos, tiles) | Separar estado intrínseco/extrínseco complica o código; só com evidência de memória |
| **Proxy** | Põe um intermediário com a mesma interface para decidir quando e como o objeto real é usado | Como o objeto é acessado; sua localização | Remoto, virtual (lazy), proteção (controle de acesso), smart reference | Latência oculta; chamadas remotas não são locais |

### Padrões comportamentais
Algoritmos e atribuição de responsabilidades entre objetos.

| Padrão | Intenção | O que pode variar | Use quando | Custo / alternativa simples |
|---|---|---|---|---|
| **Chain of Responsibility** | Faz um pedido percorrer uma fila de tratadores até um deles resolver; quem envia não sabe quem atende | Objeto que atende a solicitação | Pipelines de handlers, middlewares, validações em sequência | Sem garantia de tratamento; difícil rastrear |
| **Command** | Transforma uma ação em objeto, para guardá-la, enfileirá-la, registrá-la ou desfazê-la | Quando e como a solicitação é atendida | Undo/redo, filas de jobs, transações, macros, CQRS | Uma classe por ação. Alternativa: closures/funções de primeira classe |
| **Interpreter** | Modela as regras de uma linguagem pequena como objetos que sabem avaliar expressões | Gramática e interpretação | DSLs simples, regras, filtros | Gramáticas grandes ficam inviáveis; use um parser generator |
| **Iterator** | Percorre os itens de uma coleção sem revelar como ela guarda os dados | Como os elementos são percorridos | Coleções customizadas; percursos diferentes | Hoje nativo nas linguagens (iteradores/geradores) |
| **Mediator** | Centraliza a conversa entre vários objetos para que eles não precisem se conhecer | Como e quais objetos interagem | Muitos objetos com interações N:N (formulários, chats, orquestração) | O mediator pode virar monolito |
| **Memento** | Tira um retrato do estado de um objeto para restaurá-lo depois, sem expor seus detalhes internos | Que informação privada fica fora e quando | Undo, snapshots, checkpoints | Custo de memória de snapshots |
| **Observer** | Avisa automaticamente vários interessados quando algo muda num objeto | Número de dependentes; como se atualizam | Eventos de domínio, UI reativa, pub/sub | Atualizações em cascata inesperadas; vazamento de memória por inscrições |
| **State** | Troca o comportamento de um objeto conforme o estado dele, como se ele mudasse de classe | Estados de um objeto | Máquinas de estado com comportamento distinto por estado (pedido, conexão, workflow) | Muitas classes; para máquinas simples, uma tabela de transições basta |
| **Strategy** | Isola algoritmos intercambiáveis atrás de uma mesma interface, para trocar um pelo outro | Um algoritmo | Substituir condicionais por tipo; políticas configuráveis (preço, frete, ordenação) | Clientes precisam conhecer as estratégias. Alternativa: passar uma função |
| **Template Method** | Fixa a ordem dos passos de um algoritmo e deixa subclasses preencherem alguns deles | Passos de um algoritmo | Frameworks com ganchos ("princípio de Hollywood": não nos chame, nós chamamos você) | Usa herança; prefira Strategy quando possível |
| **Visitor** | Leva operações novas a uma estrutura de objetos sem alterar as classes dela | Operações aplicáveis | Estrutura de classes estável e muitas operações novas (ASTs, compiladores) | Adicionar novo tipo de elemento é caro; quebra encapsulamento. Alternativa: pattern matching |

## 5. Relações e distinções úteis

- **Strategy vs. State:** ambos delegam a um objeto; em State, os estados trocam o objeto
  delegado entre si; em Strategy, o cliente escolhe.
- **Decorator vs. Proxy vs. Adapter:** Decorator acrescenta responsabilidade (mesma interface);
  Proxy controla acesso (mesma interface); Adapter muda a interface.
- **Bridge vs. Adapter:** Bridge é projetado antes (duas dimensões variam); Adapter é aplicado
  depois (fazer classes existentes colaborarem).
- **Façade vs. Mediator:** Façade é unidirecional (simplifica o subsistema para o cliente);
  Mediator coordena colegas que se comunicam por ele.
- **Composite + Iterator/Visitor:** frequentemente usados juntos.
- **Abstract Factory** é comumente implementada com Factory Methods ou Prototype, e muitas vezes
  é um Singleton (prefira injeção).
- **Command + Memento:** undo; **Command + Composite:** macros.
- **Template Method** usa herança para variar parte de um algoritmo; **Strategy** usa delegação
  para variar o algoritmo inteiro.

## 6. Padrões a serviço da arquitetura (ligação com Clean Architecture)

- Fronteiras e DIP: **Abstract Factory** (criação sem conhecer concretos), **Strategy**
  (fronteira unidimensional), **Façade** (fronteira parcial), **Adapter** (adaptadores de
  interface / camada anticorrupção), **Proxy** (gateway remoto), **Observer** (eventos que
  cruzam a fronteira sem inverter dependência).
- Humble Object: Presenter/ViewModel + View passiva (relacionado a MVC — o cap. 1.2 mostra
  MVC como composição de Observer, Composite e Strategy).

## 7. Sinais de abuso de padrões

- Interface com uma única implementação sem previsão real de outra e sem necessidade de teste.
- `AbstractFactoryFactory`, camadas de indireção que só repassam chamadas.
- Singleton usado para evitar passar dependências.
- Visitor numa hierarquia que muda com frequência.
- Padrão escolhido antes de existir o problema que ele resolve.
