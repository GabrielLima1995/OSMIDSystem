# OSMIDSystem

Sistema web para visualizar trechos de vias do `osm.json`, filtrar por `logradouro`, selecionar múltiplos `id_trecho_qualidade`, adicionar/atualizar um atributo e persistir as alterações no próprio arquivo JSON.

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
3. Abra no navegador:
   - `http://localhost:3000`

## Fluxo de uso

1. Selecione um `logradouro` no filtro.
2. Visualize os trechos no mapa e selecione os `id_trecho_qualidade` na lista.
3. Informe `Nome do atributo` e `Valor do atributo`.
4. Clique em **Salvar no osm.json** para gravar as alterações no arquivo.

## API interna

- `GET /api/geojson`: retorna o conteúdo de `osm.json`.
- `POST /api/update-attributes`: recebe `{ ids, attributeName, attributeValue }` e atualiza as feições selecionadas em `osm.json`.
