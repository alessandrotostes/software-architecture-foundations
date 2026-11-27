# Engenharia de Software — Ian Sommerville (9ª edição)

Visão de engenharia sobre o ciclo de vida inteiro: processo, requisitos, modelagem, arquitetura,
projeto, testes, evolução, confiança e proteção, reúso, distribuição, serviços e qualidade.
Este arquivo foca no que um agente de código precisa para decidir e implementar bem.

## 1. Fundamentos (caps. 1–3)

- Software = programas **+ documentação + configuração**. Atributos essenciais de um bom produto:
  **manutenibilidade, confiança e proteção, eficiência, aceitabilidade**.
- Atividades de todo processo: **especificação, desenvolvimento (projeto + implementação),
  validação, evolução**.
- Modelos de processo: cascata (dirigido a planos), incremental, orientado a reúso. Na prática,
  combinam-se. Lide com mudança por **prototipação** e **entrega incremental**.
- **Ágil vs. dirigido a planos:** decida pelo tipo de sistema, tamanho, regulação, distribuição
  da equipe e cultura. Sistemas grandes e críticos precisam de mais projeto antecipado e documentação.
- Práticas XP relevantes para o agente: releases pequenos, design simples, **test-first**,
  refatoração contínua, integração contínua, propriedade coletiva do código.

## 2. Requisitos (cap. 4)

- **Funcionais:** serviços que o sistema deve prestar, como reagir a entradas.
- **Não funcionais (RNF):** restrições sobre serviços e processo — de produto (desempenho,
  confiabilidade, usabilidade, portabilidade, proteção), organizacionais (padrões, linguagens,
  processo) e externos (legislação, ética, interoperabilidade). São **propriedades emergentes**:
  aplicam-se ao sistema como um todo e frequentemente são mais críticas que requisitos funcionais.
- RNF devem ser **verificáveis/mensuráveis**: velocidade (transações/s, tempo de resposta),
  tamanho, facilidade de uso (tempo de treinamento), confiabilidade (MTTF, ROCOF, POFOD,
  disponibilidade), robustez (tempo de reinício), portabilidade.
- Validação de requisitos: **validade, consistência, completude, realismo, verificabilidade**.
- Requisitos mudam (negócio, organização, tecnologia): mantenha **rastreabilidade** e gerencie mudanças.

**Ação do agente:** ao receber uma tarefa, liste RNF implícitos (latência, volume, segurança,
privacidade, disponibilidade, compatibilidade). Se forem ambíguos, torne-os mensuráveis ou pergunte.

## 3. Modelagem (cap. 5)

- Modelos são abstrações que omitem detalhes. Perspectivas: **contexto** (limites do sistema e
  ambiente), **interação** (casos de uso, diagramas de sequência), **estrutural** (classes,
  associações, generalização), **comportamental** (atividades/dados; máquinas de estado/eventos).
- Use **diagramas de estado** para comportamento dirigido a eventos (ligação com o padrão State).
- Modele o contexto primeiro: define o que está dentro e fora (fronteiras).

## 4. Projeto de arquitetura (cap. 6)

### Decisões arquiteturais a explicitar
Existe arquitetura genérica reutilizável? Como o sistema será distribuído? Quais estilos/padrões?
Qual a abordagem fundamental de estruturação? Como decompor em módulos? Qual estratégia de
controle? Como avaliar e documentar a arquitetura?

### RNF moldam a arquitetura (e entram em conflito)
| RNF crítico | Implicação arquitetural |
|---|---|
| **Desempenho** | Localize operações críticas em poucos componentes, no mesmo nó; componentes maiores (menos comunicação); considere replicação em processadores diferentes |
| **Proteção (security)** | Estrutura em camadas, ativos mais críticos nas camadas internas, validação rigorosa nelas |
| **Segurança (safety)** | Operações de segurança concentradas em um componente ou poucos; facilita validação e desligamento seguro |
| **Disponibilidade** | Componentes redundantes; substituir/atualizar sem parar o sistema |
| **Manutenibilidade** | Componentes autocontidos de granularidade fina; separar produtores de consumidores de dados; evitar estruturas de dados compartilhadas |

Conflitos: componentes grandes favorecem desempenho; pequenos favorecem manutenibilidade.
Resolva por particionamento (partes diferentes, estilos diferentes) e torne o trade-off explícito.

### Visões (modelo 4+1 de Kruchten)
**Lógica** (abstrações-chave, objetos/classes), **de processo** (processos interativos em
runtime), **de desenvolvimento** (decomposição em componentes para equipes), **física**
(hardware e distribuição) — unidas por **casos de uso/cenários** (+1). Documente apenas o que
será útil; uma visão conceitual simples é o ponto de partida para discussão.

### Padrões de arquitetura
| Padrão | Descrição | Quando usar | Vantagens | Desvantagens |
|---|---|---|---|---|
| **MVC** | Separa apresentação/interação (View, Controller) dos dados (Model) | Múltiplas formas de ver/interagir com os mesmos dados; requisitos de UI futuros incertos | Dados e representação mudam independentemente | Código extra e complexidade para modelos simples |
| **Camadas** | Funcionalidade em camadas; cada uma usa serviços da camada abaixo | Construir sobre sistemas existentes; equipes separadas; proteção multinível | Substituir camadas inteiras preservando a interface; recursos redundantes (ex.: autenticação) por camada | Separação limpa é difícil na prática; camadas puladas; desempenho pelo número de níveis |
| **Repositório** | Dados compartilhados em repositório central acessado pelos componentes | Grandes volumes de informação de vida longa; sistemas dirigidos a dados | Componentes independentes; consistência centralizada | Ponto único de falha; ineficiência na comunicação via repositório; distribuição difícil |
| **Cliente-servidor** | Serviços em servidores separados acessados por clientes | Banco compartilhado acessado de vários locais; carga variável | Distribuição na rede; funcionalidade geral disponível a todos | Servidor como ponto de falha e de ataque; desempenho imprevisível pela rede; gestão de servidores de organizações diferentes |
| **Duto e filtro** | Transformações de dados em sequência; filtros independentes | Processamento de dados em lote ou por transações | Reúso de transformações; fácil de entender; sequencial ou concorrente | Formato de dados combinado entre filtros; parsing repetido; difícil para sistemas interativos |

Arquiteturas de aplicação genéricas: sistemas de processamento de transações, de informação,
de gerenciamento de recursos e de processamento de linguagens (tradutor + máquina abstrata).

## 5. Projeto e implementação (cap. 7)

- Projeto e implementação são intercalados. Processo OO: definir contexto e interações →
  projetar arquitetura → identificar objetos principais → desenvolver modelos de projeto →
  **especificar interfaces**.
- **Interfaces** devem ser definidas precisamente, separadas da implementação, para permitir
  desenvolvimento paralelo e substituição.
- Questões de implementação: **reúso** (considere sempre o que já existe — custos de busca,
  adaptação, configuração e integração), **gerenciamento de configuração**, **host-target**
  (desenvolve-se num ambiente e executa-se em outro), código aberto (licenças).
- Padrões de projeto (GoF) são uma forma de reúso de conhecimento de design.

## 6. Testes de software (cap. 8)

- **Testes mostram a presença de defeitos, não a ausência** (Dijkstra).
- **Validação** (construímos o produto certo?) × **verificação** (construímos o produto direito?).
  Inspeções/revisões complementam testes (analisam sem executar, encontram vários defeitos de uma vez).
- Estágios: **testes de desenvolvimento** (unidade, componente, sistema), **testes de release**
  (por equipe separada; baseados em requisitos, cenários, desempenho/estresse) e
  **testes de usuário** (alfa, beta, aceitação).
- **Testes unitários de objetos:** teste todas as operações, defina e verifique todos os
  atributos, ponha o objeto em todos os estados possíveis. Automatize (setup, chamada, asserção).
- **Escolha de casos de teste:**
  - **Partição de equivalência:** grupos de entradas tratadas igual; teste dentro de cada
    partição e nas **fronteiras** (limite inferior, limite superior, valores do meio).
  - **Diretrizes para sequências/listas:** sequência de um único valor; tamanhos diferentes em
    testes diferentes; acessar primeiro, do meio e último elemento; sequência vazia.
  - **Diretrizes gerais:** force todas as mensagens de erro; tente overflow de buffers de
    entrada; repita a mesma entrada muitas vezes; force saídas inválidas; force resultados de
    cálculo grandes ou pequenos demais.
- **Testes de componente (interfaces):** tipos de interface — de parâmetro, memória
  compartilhada, procedimento, passagem de mensagem. Erros: mau uso, mal-entendido, timing.
  Diretrizes: teste valores extremos de parâmetros; ponteiros nulos; testes de estresse em
  mensagens; varie a ordem de ativação em memória compartilhada.
- **Testes de sistema** focam interações entre componentes; use casos de uso e diagramas de
  sequência para derivá-los. Teste exaustivo é impossível: defina políticas de cobertura.
- **Desenvolvimento dirigido a testes:** benefícios — cobertura, testes de regressão, depuração
  simplificada, documentação do sistema.
- **Testes de desempenho/estresse:** aumente a carga até além do máximo projetado para observar
  degradação e falha (falha deve ser "suave").

## 7. Evolução de software (cap. 9)

- Para sistemas sob encomenda, **o custo de manutenção geralmente excede o de desenvolvimento**.
- Processo de evolução: solicitações de mudança → **análise de impacto** → planejamento de
  release → implementação → release.
- **Leis de Lehman:** mudança contínua; **aumento da complexidade** (é preciso dedicar recursos
  para preservar e simplificar a estrutura); evolução de grandes programas é autorregulada;
  estabilidade organizacional; conservação da familiaridade; crescimento contínuo; declínio de
  qualidade (sem adaptação ao ambiente); sistema de feedback.
- Tipos de manutenção: **corretiva** (defeitos), **adaptativa** (ambiente), **evolutiva/aditiva**
  (requisitos novos/alterados).
- **Refatoração** = manutenção preventiva; "maus cheiros" que indicam refatoração: código
  duplicado, métodos longos, `switch`/`case` (use polimorfismo), aglutinação de dados (troque
  por um objeto), generalidade especulativa.
- **Reengenharia:** tradução de código-fonte, engenharia reversa, melhoria da estrutura,
  modularização, reengenharia de dados — sem mudar a funcionalidade.
- **Sistemas legados:** avalie valor de negócio × qualidade (técnica e do ambiente) para decidir
  entre **descartar, manter, reestruturar (reengenharia) ou substituir**.

## 8. Sistemas sociotécnicos, confiança e proteção (caps. 10–15)

- Sistemas incluem hardware, software, pessoas e processos; **propriedades emergentes**
  (desempenho, confiabilidade, usabilidade, segurança, proteção) pertencem ao todo.
- Erros humanos são inevitáveis: projete **barreiras** (modelo do queijo suíço de Reason).
- **Dimensões da confiança:** disponibilidade, confiabilidade, segurança (safety), proteção
  (security) — mais reparabilidade, manutenibilidade, sobrevivência, tolerância a erros.
- Confiabilidade por: **evitar defeitos**, **detectar e remover defeitos**, **tolerar defeitos**.
  Use **redundância e diversidade**. Não superespecifique confiabilidade (custo).
- Arquiteturas tolerantes a defeitos: sistemas de proteção (monitor independente que desliga
  com segurança), arquiteturas de automonitoramento, programação N-version.
- **Diretrizes de programação confiável** (cap. 13):
  1. Limite a visibilidade da informação (encapsulamento, tipos abstratos).
  2. Verifique a validade de todas as entradas.
  3. Forneça um tratador para todas as exceções.
  4. Minimize o uso de construções propensas a erros (goto, ponto flutuante, ponteiros,
     alocação dinâmica, paralelismo, recursão, interrupções, herança, aliasing, vetores sem
     limite, processamento de entrada padrão).
  5. Forneça recursos de reinício (checkpoints).
  6. Verifique limites de vetores.
  7. Inclua **timeouts** ao chamar componentes externos.
  8. Dê nome a todas as constantes que representam valores do mundo real.
- **Proteção (security):** ameaças à confidencialidade, integridade e disponibilidade.
  Gerencie riscos: identifique ativos, ameaças, vulnerabilidades e controles.
  **Diretrizes de projeto para sistemas protegidos** (cap. 14):
  1. Baseie decisões numa política explícita de proteção.
  2. Evite um ponto único de falha.
  3. Falhe de maneira segura (fail securely).
  4. Equilibre proteção e usabilidade.
  5. Registre ações de usuários (logs de auditoria).
  6. Use redundância e diversidade para reduzir riscos.
  7. **Valide todas as entradas.**
  8. Compartimente seus ativos.
  9. Projete para implantação (configuração segura, menos privilégio, correções fáceis).
  10. Projete para recuperabilidade.
- **Arquitetura protegida:** proteja ativos críticos nas camadas internas (defesa em
  profundidade); distribua ativos para limitar perdas de um ataque bem-sucedido.
- **Sobrevivência:** continuar entregando serviços essenciais sob ataque ou após dano parcial
  (reconhecimento, resistência, recuperação).
- **V&V de sistemas críticos:** análise estática, verificação de modelos, testes estatísticos
  com perfil operacional, equipes tigre, casos de segurança com argumentos estruturados.

## 9. Engenharia de software avançada (caps. 16–21)

### Reúso (cap. 16)
- Níveis: abstração (padrões), objeto, componente, sistema. Abordagens: padrões de
  arquitetura e de projeto, frameworks de aplicação, linhas de produtos, sistemas COTS/ERP,
  bibliotecas, serviços, geradores de programas, programação orientada a aspectos.
- Benefícios: menor custo, desenvolvimento mais rápido, menos riscos, mais confiança.
  Problemas: custos de manutenção, falta de controle sobre evolução e desempenho de terceiros,
  síndrome do "não inventado aqui", dificuldade de integração.
- **Frameworks** são estruturas inversoras de controle (o framework chama o seu código) e
  incorporam padrões de projeto.

### Engenharia baseada em componentes (cap. 17)
- Componente: unidade independente cuja funcionalidade e dependências são **totalmente
  definidas por interfaces** (fornecidas e requeridas). Componível sem conhecer a implementação.
- Modelo de componente: padrões de interface, uso e implantação + serviços de middleware.
- Composição: **sequencial, hierárquica, aditiva**. Componentes de terceiros exigem
  **adaptadores ("glue code")** para conciliar interfaces (padrão Adapter).
- Ao compor, considere funcionalidade, RNF e **facilidade de substituição**.

### Sistemas distribuídos (cap. 18)
- Benefícios: compartilhamento de recursos, abertura, concorrência, escalabilidade, tolerância a defeitos.
- Questões de projeto: **transparência, abertura, escalabilidade (tamanho, distribuição,
  gerenciabilidade), proteção, qualidade de serviço, gerenciamento de falhas**.
- Interação por **chamada de procedimento remoto** (síncrona) ou **passagem de mensagens**
  (assíncrona); middleware trata a comunicação e a interoperabilidade.
- Padrões: mestre-escravo, cliente-servidor de duas camadas (cliente magro/gordo), cliente-servidor
  multicamadas, componentes distribuídos, ponto a ponto. Software como serviço.
- Projete para falha: a rede é não confiável; componentes falham parcialmente.

### Arquitetura orientada a serviços (cap. 19)
- Serviços: componentes fracamente acoplados, independentes de plataforma, reutilizáveis,
  com interface publicada (WSDL/SOAP na edição; hoje, frequentemente REST/HTTP + JSON).
- Tipos: **utilitários** (genéricos), **de negócio** (parte de um processo), **de coordenação**
  (orquestram outros serviços / workflow).
- Engenharia de serviço: identificar candidatos → projetar interface → implementar e testar → implantar.
- Sistemas legados podem ser envolvidos por interfaces de serviço (wrapping).
- Composição de serviços a partir de modelos de processo de negócio.

### Software embutido e tempo real (cap. 20)
- A correção depende do resultado **e** do tempo. Modelado como processos que reagem a
  estímulos (periódicos e aperiódicos). Modelos de estado são centrais.
- Padrões: observar e reagir, controle de ambiente, pipeline de processamento.
- Análise de timing: deadlines, frequência e pior tempo de execução de cada processo.

### Orientação a aspectos (cap. 21)
- **Separação de interesses.** Interesses transversais (log, segurança, transações, métricas)
  causam **entrelaçamento** (um módulo implementa vários requisitos) e **espalhamento**
  (um interesse espalhado em vários módulos).
- Aspectos = ponto de corte (onde) + adendo (o quê), aplicados em pontos de junção.
- Ideia aplicável sem AOP: núcleo implementa interesses primários; extensões (middleware,
  Decorators, interceptors) implementam os secundários/transversais.

## 10. Gerenciamento (caps. 22–26)

- **Riscos** são a tarefa central: identifique (tecnologia, pessoas, organização, ferramentas,
  requisitos, estimativa), analise probabilidade × impacto, planeje (evitar, minimizar,
  contingência), monitore.
- Equipes pequenas e coesas; comunicação depende do tamanho e da estrutura (Lei de Conway
  aparece em Clean Architecture também).
- Planejamento: marcos, entregáveis; estimativa por experiência ou algorítmica (COCOMO II);
  no XP, jogo do planejamento com escopo ajustável.
- **Qualidade:** padrões de produto e processo; **revisões e inspeções** (checklists de
  defeitos comuns); métricas para encontrar componentes anômalos (complexidade ciclomática,
  fan-in/fan-out, tamanho, profundidade de herança, acoplamento, coesão) — métricas apontam
  onde olhar, não substituem análise.
- **Gerenciamento de configuração:** gerenciamento de mudanças, de versões (branches, merges),
  construção do sistema (builds automatizados) e de releases. **Reconstrua e teste com frequência**
  (integração contínua, builds diários).
- **Melhoria de processo:** medir → analisar → mudar; ágil (reduzir overhead) ou por maturidade (CMMI).

## Checklist Sommerville para uma mudança

- [ ] Requisito funcional claro e RNF mensuráveis identificados?
- [ ] Impacto da mudança analisado (o que mais é afetado)?
- [ ] Estilo arquitetural coerente com os RNF críticos?
- [ ] Interfaces especificadas antes da implementação?
- [ ] Reúso considerado (biblioteca, serviço, componente) e seus riscos avaliados?
- [ ] Testes cobrem partições, fronteiras, mensagens de erro e casos de sequência?
- [ ] Entradas validadas, exceções tratadas, timeouts em chamadas externas, constantes nomeadas?
- [ ] Ativos sensíveis compartimentados, menor privilégio, logs de auditoria, falha segura?
- [ ] Build e testes automatizados rodando a cada mudança; versão e release rastreáveis?
