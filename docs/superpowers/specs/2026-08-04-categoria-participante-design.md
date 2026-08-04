# Categoria do participante — Design

**Data:** 2026-08-04  
**Status:** Aprovado

## Objetivo

Classificar cada participante como estudante ou profissional no cadastro, permitir que o administrador corrija a categoria e incluir o dado nas exportações de credenciamento.

## Modelo de dados

A tabela `ingressos` receberá a coluna `categoria`, limitada no banco aos valores `pendente`, `estudante` e `profissional`.

- Registros existentes serão migrados como `pendente`.
- Novas inscrições deverão informar `estudante` ou `profissional`.
- `pendente` será reservado aos registros anteriores à implementação.

## Cadastro público

Cada bloco de participante em `/inscricao` terá um campo obrigatório “Categoria”, com somente as opções “Estudante” e “Profissional”. A categoria será enviada junto aos demais dados do participante.

A API `/api/inscricao` validará o campo no servidor. Valores ausentes ou diferentes de `estudante` e `profissional` serão rejeitados antes de qualquer gravação.

## Administração

Os detalhes de cada participante no painel exibirão “Pendente”, “Estudante” ou “Profissional”. O administrador poderá alterar a categoria para estudante ou profissional.

Antes da atualização, o painel mostrará uma confirmação informando o nome do participante e a nova categoria. Uma rota administrativa protegida validará o novo valor e atualizará somente o ingresso selecionado.

## Exportações

As exportações de credenciamento em CSV, Excel e PDF incluirão a coluna “Categoria”, usando os rótulos “Pendente”, “Estudante” e “Profissional”. As exportações de pagamentos não serão alteradas porque representam pedidos, não participantes.

## Verificação

Os testes de validação da inscrição cobrirão:

- aceitação de `estudante` e `profissional`;
- rejeição de categoria ausente;
- rejeição de categoria inválida.

Também serão executados os testes, o lint e o build disponíveis no projeto.

## Fora do escopo

- Cadastro de categorias adicionais.
- Preços diferentes por categoria.
- Edição dos demais dados pessoais pelo painel.
- Alteração em massa dos registros pendentes.
