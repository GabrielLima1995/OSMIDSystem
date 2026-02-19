# OSMIDSystem

Sistema web para visualizar trechos de vias do `osm.json`, filtrar por `logradouro`, selecionar múltiplos `id_trecho_qualidade`, atualizar o atributo fixo `paviment` com base no campo `nome_do_classificador` e persistir as alterações no próprio arquivo JSON.

## Como executar

1. Inicie o servidor:
   ```bash
   npm start
   ```
2. Abra no navegador:
   - `http://localhost:3000`

## Fluxo de uso

1. Selecione um `logradouro` no filtro.
2. Visualize os trechos no mapa e selecione os `id_trecho_qualidade` na lista (ou clique em um trecho no mapa para selecionar automaticamente todos os trechos daquele logradouro).
3. Edite o campo `nome_do_classificador` (vem marcado por padrão e pode ser alterado).
4. Clique em **Salvar no osm.json** para gravar as alterações no atributo `paviment`.

## API interna

- `GET /api/geojson`: retorna o conteúdo de `osm.json`.
- `POST /api/update-attributes`: recebe `{ ids, attributeName, attributeValue }` e atualiza as feições selecionadas em `osm.json`.
