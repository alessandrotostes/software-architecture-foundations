# Checklist de revisão e tabela "cheiro → remédio"

Use ao revisar um PR, auditar um módulo ou planejar uma refatoração. Para cada achado, informe:
**local**, **princípio violado**, **impacto no custo de mudança**, **menor correção possível**.

## 1. Perguntas de revisão, em ordem de importância

1. **Correção e testes** — O comportamento novo tem teste que falharia sem a mudança?
   Bugs corrigidos têm teste de regressão? A suíte inteira passa? (Beck)
2. **Direção das dependências** — Algum módulo de domínio/caso de uso importa framework,
   ORM, HTTP, SDK de nuvem, UI? (Regra da Dependência, DIP)
3. **Responsabilidades** — Alguma classe/arquivo muda por pedido de mais de um ator?
   (SRP / CCP)
4. **Acoplamento** — Ciclos entre pacotes? Componente estável dependendo de um volátil?
   Interfaces gordas? (ADP, SDP, ISP)
5. **Confiabilidade e proteção** — Entradas externas validadas? Exceções tratadas? Timeouts e
   retries com limite? Segredos fora do código? Menor privilégio? Logs de auditoria sem
   dados sensíveis? (Sommerville 13–14)
   **Multi-tenant:** toda consulta e escrita filtra pelo tenant do usuário autenticado (nunca
   por um id vindo do cliente)? A autorização é checada por recurso, não só por rota? Existe
   teste que tenta acessar dado de outro tenant e espera recusa?
6. **Proporcionalidade** — Há abstração, padrão ou camada sem variação real que a justifique?
   (GoF 1.8, YAGNI) Ou, ao contrário, falta a fronteira que evitaria espalhar um detalhe?
7. **Legibilidade e intenção** — Nomes do domínio; papéis de padrões refletidos nos nomes;
   constantes do mundo real nomeadas.

## 2. Cheiro → causa provável → remédio

| Cheiro observado | Causa / princípio | Remédio (do mais leve ao mais pesado) |
|---|---|---|
| Mudança simples exige editar muitos arquivos (rigidez) | Responsabilidade espalhada; falta de CCP | Agrupar o que muda junto; mover método; extrair módulo por ator |
| Mudança quebra algo não relacionado (fragilidade) | Acoplamento oculto, estado global, duplicação acidental unificada | Separar por ator; remover Singletons/estado global; injetar dependências |
| Impossível reusar parte sem arrastar o resto (imobilidade) | Dependência de detalhes concretos | Extrair interface no lado do consumidor (DIP); Adapter |
| Regra de negócio dentro de controller/handler/view | Mistura de política e detalhe | Extrair caso de uso (interactor) com DTOs de entrada/saída; controller só traduz |
| Entidade herda de modelo do ORM / tem anotações de framework e é usada em toda parte | "Casou com o framework"; banco não tratado como detalhe | Entidade pura + mapeador no gateway; repositório como interface no núcleo |
| Objeto do banco chega até a UI/JSON de resposta | Fronteira atravessada por estrutura errada | DTO/ViewModel na fronteira; Presenter |
| `switch`/`if` sobre tipo repetido em vários lugares | Polimorfismo ausente; OCP violado | Strategy / State / Command; tabela de despacho; Pluggable Object |
| Construtor com muitos parâmetros opcionais | Construção complexa | Builder; parâmetros nomeados; objeto de configuração |
| `new ConcreteX()` espalhado pelo núcleo | Criação acoplada ao concreto (causa de reprojeto nº 1) | Injeção pelo Main; Factory/Abstract Factory |
| Explosão de subclasses para combinar comportamentos | Herança usada para variar (causa nº 7) | Decorator, Strategy, Bridge; composição |
| Biblioteca externa usada diretamente em dezenas de arquivos | Dependência de plataforma/API (causa nº 3/8) | Adapter/Gateway com interface própria; testes de aprendizado |
| Subsistema complexo exposto a todos | Acoplamento forte (causa nº 6) | Façade; módulo com API pública mínima e `internal` no resto |
| Muitos objetos se chamando em N:N | Acoplamento entre colegas | Mediator; eventos de domínio (Observer) |
| Subclasse que lança "não suportado" ou exige `if (x instanceof Y)` | LSP violado | Repensar hierarquia; composição; interfaces menores |
| Interface com 15 métodos, cada cliente usa 2 | ISP violado | Dividir por cliente/papel |
| Ciclo entre pacotes A ↔ B | ADP violado | Interface em A implementada em B (DIP) ou extrair pacote C comum |
| Pacote muito usado e cheio de classes concretas que mudam muito | Zona da Dor (I≈0, A≈0, volátil) | Extrair abstrações estáveis; mover voláteis para pacotes instáveis |
| Interfaces/abstrações sem implementações nem uso | Zona da Inutilidade / generalidade especulativa | Remover; inline |
| Testes com setup enorme | Objetos grandes demais (Beck) | Dividir objetos; Test Data Builder; fixtures |
| Testes quebram a cada refatoração | Testes acoplados à estrutura (testes frágeis) | Testar via API pública / API de teste; menos mocks de internos |
| Testes lentos que precisam de banco/rede | Núcleo acoplado a I/O | Portas + dublês em memória; testes de integração separados e poucos |
| Lógica não testada na UI | Falta de Humble Object | Presenter/ViewModel testável; View passiva |
| Microsserviços que sempre mudam juntos / compartilham tabelas | Falácia do desacoplamento por serviço | Fronteiras por domínio; componentes dentro do serviço; contratos de dados versionados |
| Chamada externa sem timeout; falha derruba tudo | Diretriz de programação confiável 7; ponto único de falha | Timeout, retry com backoff limitado, circuit breaker, fallback, falha segura |
| Entrada do usuário usada sem validação | Diretrizes 2 (confiável) e 7 (protegido) | Validar na borda (tipo, faixa, formato, tamanho); rejeitar por padrão |
| Consulta sem filtro de tenant, ou tenant vindo do corpo/URL da requisição | Isolamento de dados; compartimentar ativos (Sommerville 14) | Tenant derivado da sessão/token; repositório que exige `tenantId`; política de RLS no banco; teste de acesso cruzado |
| Autorização só na rota/menu, não no recurso | Falha de controle de acesso; defesa em profundidade | Checar permissão no caso de uso para o recurso específico (dono, tenant, papel) |
| Números mágicos | Diretriz 8 (constantes nomeadas) | Constantes/enum com nome do domínio |
| Código duplicado | Duplicação (Beck, Sommerville) | Primeiro classifique: verdadeira → extrair; acidental → manter separado |
| Método longo | Refatoração (Sommerville cap. 9) | Extrair método; Method Object |
| Mesmo grupo de campos/parâmetros em vários lugares | Aglutinação de dados | Value Object |
| Pasta raiz `controllers/ models/ services/` em sistema grande | Arquitetura não "grita" o domínio | Pacotes por funcionalidade/componente; módulos de domínio |

## 3. Formato de saída sugerido para revisão

```
### [SEVERIDADE] Título curto
Local: caminho/arquivo.ext:linha
Princípio: <ex.: Regra da Dependência (Clean Architecture cap. 22)>
Problema: <o que acontece hoje e por que encarece mudanças/causa risco>
Sugestão: <menor mudança que resolve; esboço de código se útil>
Trade-off: <custo da sugestão; quando NÃO vale a pena>
```

Severidades: **Bloqueante** (bug, falha de proteção, vazamento entre tenants, teste ausente para regra nova),
**Importante** (violação de fronteira/dependência que vai se espalhar), **Sugestão** (melhoria
local), **Nit** (estilo).
