const logradouroSelect = document.getElementById('logradouroSelect');
const trechosList = document.getElementById('trechosList');
const selectAllBtn = document.getElementById('selectAllBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const attributeNameInput = document.getElementById('attributeName');
const attributeValueInput = document.getElementById('attributeValue');
const saveBtn = document.getElementById('saveBtn');
const feedback = document.getElementById('feedback');

const map = L.map('map').setView([-30.03, -51.23], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let allFeatures = [];
let currentLayers = [];
const selectedTrechos = new Set();

function clearMapLayers() {
  currentLayers.forEach((layer) => map.removeLayer(layer));
  currentLayers = [];
}

function createTrechoItem(feature) {
  const trechoId = feature.properties.id_trecho_qualidade;

  const li = document.createElement('li');
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = selectedTrechos.has(trechoId);

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selectedTrechos.add(trechoId);
    } else {
      selectedTrechos.delete(trechoId);
    }
  });

  const text = document.createTextNode(` ${trechoId}`);
  label.appendChild(checkbox);
  label.appendChild(text);
  li.appendChild(label);
  return li;
}

function renderFilteredData(logradouro) {
  clearMapLayers();
  trechosList.innerHTML = '';

  const filtered = allFeatures.filter(
    (feature) => feature.properties.logradouro === logradouro
  );

  if (filtered.length === 0) {
    feedback.textContent = 'Nenhum trecho encontrado para este logradouro.';
    return;
  }

  feedback.textContent = `${filtered.length} trecho(s) carregado(s).`;

  const latLngGroups = [];
  filtered.forEach((feature) => {
    const layer = L.geoJSON(feature, {
      style: {
        color: selectedTrechos.has(feature.properties.id_trecho_qualidade)
          ? '#d00'
          : '#005eff',
        weight: 4
      }
    }).addTo(map);

    layer.bindPopup(
      `<strong>${feature.properties.id_trecho_qualidade}</strong><br>${feature.properties.logradouro}`
    );

    currentLayers.push(layer);
    trechosList.appendChild(createTrechoItem(feature));

    if (layer.getBounds) {
      const b = layer.getBounds();
      latLngGroups.push([b.getSouthWest(), b.getNorthEast()]);
    }
  });

  if (latLngGroups.length > 0) {
    map.fitBounds(latLngGroups.flat(), { padding: [20, 20] });
  }
}

function refreshCurrentView() {
  renderFilteredData(logradouroSelect.value);
}

logradouroSelect.addEventListener('change', refreshCurrentView);

selectAllBtn.addEventListener('click', () => {
  const currentLogradouro = logradouroSelect.value;
  const ids = allFeatures
    .filter((feature) => feature.properties.logradouro === currentLogradouro)
    .map((feature) => feature.properties.id_trecho_qualidade);

  ids.forEach((id) => selectedTrechos.add(id));
  refreshCurrentView();
});

clearSelectionBtn.addEventListener('click', () => {
  selectedTrechos.clear();
  refreshCurrentView();
});

saveBtn.addEventListener('click', async () => {
  const ids = Array.from(selectedTrechos);
  const attributeName = attributeNameInput.value.trim();
  const attributeValue = attributeValueInput.value;

  if (!attributeName) {
    feedback.textContent = 'Informe o nome do atributo.';
    return;
  }

  if (ids.length === 0) {
    feedback.textContent = 'Selecione ao menos um id_trecho_qualidade.';
    return;
  }

  try {
    const response = await fetch('/api/update-attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, attributeName, attributeValue })
    });

    if (!response.ok) {
      const errorPayload = await response.json();
      throw new Error(errorPayload.error || 'Falha ao salvar alterações.');
    }

    const result = await response.json();
    feedback.textContent = `Atualização concluída: ${result.updatedCount} trecho(s) salvo(s) no osm.json.`;
    selectedTrechos.clear();
    refreshCurrentView();
  } catch (error) {
    feedback.textContent = error.message;
  }
});

async function init() {
  const response = await fetch('/api/geojson');
  const data = await response.json();
  allFeatures = data.features || [];

  const logradouros = [...new Set(allFeatures.map((f) => f.properties.logradouro))].sort();
  logradouroSelect.innerHTML = logradouros
    .map((logradouro) => `<option value="${logradouro}">${logradouro}</option>`)
    .join('');

  if (logradouros.length > 0) {
    renderFilteredData(logradouros[0]);
  } else {
    feedback.textContent = 'Nenhum logradouro encontrado no arquivo.';
  }
}

init();
