# Specs (Spec-Driven Development)

Esta pasta guarda a especificação de cada **feature nova** do projeto,
escrita *antes* da implementação. A partir da adoção desta metodologia, a
spec é a fonte de verdade — o código é derivado dela, e a spec deve ser
atualizada se a implementação revelar que ela estava errada ou incompleta.

Não é retroativo: features já existentes no projeto **não** precisam ganhar
uma spec aqui. O processo vale para o que for construído a partir de agora.

## Quando abrir uma spec

Abra uma pasta em `specs/<nome-da-feature>/` para qualquer mudança que
introduza comportamento novo (nova tela, novo endpoint, nova regra de
negócio). Bugfixes pequenos e ajustes triviais (typo, estilo, refactor
local) não precisam de spec.

## Fluxo

1. **`spec.md`** — o quê e por quê.
   - Problema / motivação
   - Escopo (o que entra e o que fica de fora)
   - Comportamento esperado
   - Critérios de aceite (verificáveis)
   - **Sem** decisões de implementação aqui.

2. **`plan.md`** — como, tecnicamente.
   - Endpoints/contratos afetados (request/response)
   - Mudanças de schema (tabelas, colunas, migrations)
   - Componentes/páginas no frontend
   - Riscos, trade-offs, alternativas descartadas

3. **`tasks.md`** — quebra do plano em tarefas pequenas e verificáveis,
   uma por linha, na ordem em que devem ser feitas. Cada tarefa deve ser
   concluível e testável isoladamente.

4. **Implementação** — seguir as tasks. Se algo no plano ou na spec precisar
   mudar durante a implementação, atualize o arquivo correspondente no
   mesmo PR (a spec não é descartada depois de escrita).

## Começando uma feature nova

```bash
cp -r specs/TEMPLATE specs/<nome-da-feature>
```

Preencha `spec.md` primeiro, revise com o time/usuário se necessário, só
então siga para `plan.md` e `tasks.md`.
