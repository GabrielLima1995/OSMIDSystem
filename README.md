# OSMIDSystem

Sistema web para visualizar trechos de vias do `osm.json`, filtrar por `logradouro`, selecionar individualmente os `id_trecho_qualidade` (inclusive por clique na geometria), exibir cada trecho com cor distinta, atualizar o atributo fixo `paviment` com base no campo `nome_do_classificador` e persistir as alterações no próprio arquivo JSON.

## Como executar

1. Inicie o servidor:
   ```bash
   npm start
   ```
2. Abra no navegador:
   - `http://localhost:3000`

## Fluxo de uso

1. Selecione um `logradouro` no filtro.
2. Visualize os trechos no mapa e selecione os `id_trecho_qualidade` na lista ou clicando diretamente na geometria, trecho a trecho.
3. Edite o campo `nome_do_classificador` (vem marcado por padrão e pode ser alterado).
4. Clique em **Salvar no osm.json** para gravar as alterações no atributo `paviment`.

## API interna

- `GET /api/geojson`: retorna o conteúdo de `osm.json`.
- `POST /api/update-attributes`: recebe `{ ids, attributeName, attributeValue }` e atualiza as feições selecionadas em `osm.json`.
