# TDD — Desenvolvimento Guiado por Testes — Kent Beck

## 1. Essência

- **Objetivo:** código limpo que funciona (Ron Jeffries). Divida e conquiste: primeiro "funciona",
  depois "limpo" — o oposto de projetar tudo antes.
- **Duas regras:**
  1. Escreva código novo apenas se um teste automatizado falhou.
  2. Elimine duplicação.
- **Ciclo (mantra):**
  1. **Vermelho** — escreva um pequeno teste que não funcione (talvez nem compile).
  2. **Verde** — faça o teste funcionar rapidamente, cometendo os "pecados" necessários.
  3. **Refatorar** — elimine toda duplicação criada só para o teste passar.
- **Implicações técnicas:** projetar organicamente com feedback; os próprios desenvolvedores
  escrevem os testes; ambiente com resposta rápida; design com **componentes altamente coesos e
  fracamente acoplados** para que testar seja fácil. Dificuldade de testar = sinal de design ruim.
- **TDD gerencia o medo:** testes transformam ansiedade em tédio controlado. Ajuste o tamanho
  do passo: passos pequenos quando inseguro, maiores quando confiante.
- **Dependência e duplicação:** duplicação entre teste e código (ex.: o teste espera 10 e o
  código retorna 10) é o sinal de dependência a eliminar na refatoração.

## 2. Ciclo detalhado (exemplo Money, Parte I)

1. Adicione rapidamente um teste.
2. Rode todos os testes e veja o novo falhar.
3. Faça uma pequena mudança.
4. Rode todos os testes e veja todos passarem.
5. Refatore para remover duplicação.

Lições do exemplo financeiro: cada teste cobre um pequeno incremento; mantenha uma lista de
afazeres; faça o teste compilar com stubs; faça-o rodar com código "sujo"; generalize
gradualmente substituindo constantes por variáveis; reutilize a interface que você *gostaria*
de ter (escreva o teste como uma história); value objects (`Money`) e **Expression/Composite**
surgiram da refatoração, não de projeto prévio.

Lições do exemplo xUnit (Parte II): é possível testar o próprio framework de testes com ele
mesmo; `setUp`/`tearDown`; contagem e relatório de falhas; suítes como Composite.

## 3. Padrões de TDD (Parte III)

### Padrões fundamentais (cap. 25)
- **Teste (substantivo):** procedimento automatizado que verifica o software. Testar é decidir
  se aceitamos o resultado.
- **Teste isolado:** testes não afetam uns aos outros; ordem irrelevante; rodar um não exige
  rodar outros. Isso leva a design com objetos pequenos e coesos.
- **Lista de testes:** antes de começar, escreva todos os testes que você sabe que terá de
  escrever. Novos itens surgem — anote, não se desvie. Inclua refatorações pendentes.
- **Teste primeiro:** escreva o teste antes do código a ser testado.
- **Asserção primeiro:** comece escrevendo as asserções e trabalhe "para trás".
- **Dados de teste:** use dados fáceis de ler e entender; não use o mesmo valor para coisas
  diferentes (ex.: não 2 para tudo).
- **Dados evidentes:** torne explícita no teste a relação entre entrada e saída esperada
  (ex.: `expected = 100 / 2 * (1 - 0.0015)`), não só o número final.

### Padrões de barra vermelha — que teste escrever (cap. 26)
- **Teste de um passo:** escolha o próximo teste que ensine algo e que você confie que consegue implementar.
- **Teste inicial:** comece com uma variante que não faz nada útil (caso trivial) para estabilizar a interface.
- **Teste de explicação:** peça e dê explicações em forma de testes.
- **Teste de aprendizado:** escreva testes para APIs externas antes de usá-las pela primeira
  vez; reexecute-os quando a biblioteca mudar de versão.
- **Outro teste:** ideias tangenciais viram itens na lista; mantenha o foco.
- **Teste de regressão:** quando um defeito é relatado, escreva o menor teste que falha por
  causa dele; só então corrija.
- **Pausa / Faça de novo:** cansado ou perdido? Descanse. Muito perdido? Jogue fora e recomece.
- **Mesa barata, cadeira legal:** cuide do ambiente físico.

### Padrões de teste (cap. 27)
- **Teste filho:** teste grande demais? Escreva um menor que represente a parte que falha, depois volte.
- **Objeto simulado (mock):** para recursos caros ou complicados (banco), use uma versão falsa
  que responde com constantes. Força a pensar na visibilidade e no acoplamento.
- **Autodesvio (Self Shunt):** o próprio caso de teste implementa a interface e recebe as
  chamadas do objeto testado.
- **String de log:** registre a sequência de chamadas numa string e verifique-a.
- **Crash Test Dummy:** objeto especial que lança exceção para testar caminhos de erro.
- **Teste quebrado:** ao programar sozinho, termine a sessão com um teste quebrado — sabe-se onde recomeçar.
- **Check-in limpo:** em equipe, só integre com todos os testes passando.

### Padrões de barra verde — como fazer passar (cap. 28)
- **Fazer de conta (Fake It):** retorne uma constante; depois substitua gradualmente por variáveis.
  Efeito psicológico e de controle de escopo.
- **Triangular:** generalize somente quando houver dois ou mais exemplos; o segundo força a abstração.
  Use quando não souber a abstração correta.
- **Implementação óbvia:** se sabe o que escrever e é simples, escreva. Se tomar barras
  vermelhas inesperadas, volte para passos menores (Fake It/Triangular).
- **Um para muitos:** implemente uma operação para um elemento; depois para coleções.

### Padrões xUnit (cap. 29)
- **Asserção:** verificações booleanas automáticas; seja específico (`assertEquals(50, ...)`).
  Teste comportamento via protocolo público, não estado privado.
- **Fixture:** objetos comuns a vários testes criados em `setUp`. Trade-off: duplicação vs.
  legibilidade (às vezes repetir no teste é mais claro).
- **Fixture externa:** libere recursos em `tearDown`.
- **Método de teste:** um método por caso; nomes descritivos; hierarquia por fixture.
- **Teste de exceção:** verifique que a exceção esperada é lançada.
- **Todos os testes:** uma suíte que roda tudo.

### Padrões de projeto que emergem no TDD (cap. 30)
Command, Value Object (imutável; igualdade por valor; evita aliasing), Null Object (evita
checagens de nulo), Template Method, Pluggable Object (polimorfismo no lugar de condicional
duplicado), Pluggable Selector, Factory Method, Impostor (nova implementação da mesma
interface), Composite, Collecting Parameter, Singleton (Beck: como fornecer variáveis globais? "Não faça isso.").

### Refatoração (cap. 31) — mudar o design sem mudar o comportamento
- **Reconciliar diferenças:** torne dois trechos similares idênticos passo a passo antes de unificar.
- **Isolar mudança:** isole a parte que precisa mudar antes de mudá-la.
- **Migrar dados:** duplique temporariamente a representação, migre, remova a antiga.
- Extrair método, Método em linha (inline), Extrair interface, Mover método, Objeto método,
  Adicionar parâmetro, Parâmetro de método para parâmetro de construtor.
- Em TDD, refatoração significa equivalência observacional: todos os testes passam antes e depois.

### Dominando TDD (cap. 32) — perguntas frequentes
- **Tamanho dos passos:** variável; aprenda a dar passos minúsculos para quando precisar.
- **O que testar:** "escreva testes até que o medo se transforme em tédio" (Phlip). Teste condicionais,
  laços, operações e polimorfismo do seu código; não teste código de terceiros (exceto
  testes de aprendizado).
- **Bons testes indicam bom design;** problemas nos testes revelam problemas de design:
  - setup longo → objetos grandes demais;
  - setup duplicado → falta um objeto/fixture comum;
  - testes lentos → é difícil testar as partes isoladamente (problema de design); a suíte
    tende a ser aparada até caber em ~10 minutos;
  - testes frágeis → uma parte afeta outra inesperadamente; quebre a conexão ou junte as partes.
- **Quantos feedbacks:** o suficiente para ter confiança; testes redundantes atrapalham.
- **Quando apagar testes:** se não aumentam a confiança nem comunicam algo novo.
- **TDD em código legado:** comece onde dói; adicione testes ao redor da área a mudar; refatore
  progressivamente.
- **TDD e Aberto/Fechado / design simples:** o código resultante tende a ser fracamente acoplado
  e coeso; o design emerge. Regras do design simples (Beck): roda todos os testes, sem
  duplicação, expressa intenção, mínimo de classes e métodos.

## 4. Regras práticas para o agente

0. **Escopo do test-first:** aplique o ciclo completo em entidades, casos de uso e toda lógica
   com decisão (condicionais, cálculos, regras, transformações). Cola, configuração,
   scaffolding e layout de UI sem lógica não pedem teste unitário próprio: cubra o fluxo com
   poucos testes de integração/e2e ou deixe sem teste — e diga qual escolha fez e por quê.
1. Antes de mexer em código, localize ou crie os testes que o cobrem. Rode-os.
2. Escreva a lista de testes no início da tarefa (no plano ou como comentários temporários).
   Se existir spec, os critérios de aceite dela são os primeiros itens da lista.
3. Um teste por vez; veja-o falhar pela razão certa antes de implementar.
4. Faça o mínimo para passar; refatore com tudo verde.
5. Nunca enfraqueça ou apague um teste só para fazer a suíte passar.
6. Bug → teste de regressão primeiro.
7. Mantenha testes rápidos e isolados; dependências lentas atrás de interfaces + dublês.
8. Teste pelo comportamento público; evite acoplar ao layout interno (ver "testes frágeis"
   em Clean Architecture).
9. Nomeie testes como especificação — resultado + condição — no estilo idiomático da
   linguagem e no idioma do projeto. Ex.: `it('deve recusar o cupom quando expirado')`
   (Jest/Vitest), `test_deve_recusar_cupom_quando_expirado` (pytest),
   `deveRecusarCupomQuandoExpirado()` (JUnit).
10. Ao final, rode a suíte completa.
