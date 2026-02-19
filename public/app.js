const logradouroSelect = document.getElementById('logradouroSelect');
const trechosList = document.getElementById('trechosList');
const selectAllBtn = document.getElementById('selectAllBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const classifierToggle = document.getElementById('classifierToggle');
const classifierNameInput = document.getElementById('classifierName');
const saveBtn = document.getElementById('saveBtn');
const feedback = document.getElementById('feedback');

const ATTRIBUTE_NAME = 'paviment';
const TRECHO_COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#17becf',
  '#bcbd22',
  '#d62728',
  '#7f7f7f'
];

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

function getFeaturesByLogradouro(logradouro) {
  return allFeatures.filter((feature) => feature.properties.logradouro === logradouro);
}

function getColorForTrecho(trechoId) {
  let hash = 0;
  for (let i = 0; i < trechoId.length; i += 1) {
    hash = (hash << 5) - hash + trechoId.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % TRECHO_COLORS.length;
  return TRECHO_COLORS[index];
}

function toggleTrechoSelection(trechoId) {
  if (selectedTrechos.has(trechoId)) {
    selectedTrechos.delete(trechoId);
  } else {
    selectedTrechos.add(trechoId);
  }
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
    refreshCurrentView(false);
  });

  const text = document.createTextNode(` ${trechoId}`);
  label.appendChild(checkbox);
  label.appendChild(text);
  li.appendChild(label);
  return li;
}

function renderFilteredData(logradouro, shouldFitBounds = true) {
  clearMapLayers();
  trechosList.innerHTML = '';

  const filtered = getFeaturesByLogradouro(logradouro);

  if (filtered.length === 0) {
    feedback.textContent = 'Nenhum trecho encontrado para este logradouro.';
    return;
  }

  feedback.textContent = `${filtered.length} trecho(s) carregado(s). Clique na geometria para marcar trecho a trecho.`;

  const latLngGroups = [];
  filtered.forEach((feature) => {
    const trechoId = feature.properties.id_trecho_qualidade;
    const trechoColor = getColorForTrecho(trechoId);
    const isSelected = selectedTrechos.has(trechoId);

    const layer = L.geoJSON(feature, {
      style: {
        color: trechoColor,
        weight: isSelected ? 8 : 5,
        opacity: isSelected ? 1 : 0.8
      }
    }).addTo(map);

    layer.bindPopup(`<strong>${trechoId}</strong><br>${feature.properties.logradouro}`);

    layer.on('click', () => {
      toggleTrechoSelection(trechoId);
      refreshCurrentView(false);
    });

    currentLayers.push(layer);
    trechosList.appendChild(createTrechoItem(feature));

    if (layer.getBounds) {
      const b = layer.getBounds();
      latLngGroups.push([b.getSouthWest(), b.getNorthEast()]);
    }
  });

  if (shouldFitBounds && latLngGroups.length > 0) {
    map.fitBounds(latLngGroups.flat(), { padding: [20, 20] });
  }
}

function refreshCurrentView(shouldFitBounds = true) {
  renderFilteredData(logradouroSelect.value, shouldFitBounds);
}

logradouroSelect.addEventListener('change', () => refreshCurrentView(true));

selectAllBtn.addEventListener('click', () => {
  const ids = getFeaturesByLogradouro(logradouroSelect.value).map(
    (feature) => feature.properties.id_trecho_qualidade
  );
  ids.forEach((id) => selectedTrechos.add(id));
  refreshCurrentView(false);
});

clearSelectionBtn.addEventListener('click', () => {
  selectedTrechos.clear();
  refreshCurrentView(false);
});

classifierToggle.addEventListener('change', () => {
  classifierNameInput.disabled = !classifierToggle.checked;
});

saveBtn.addEventListener('click', async () => {
  const ids = Array.from(selectedTrechos);

  if (ids.length === 0) {
    feedback.textContent = 'Selecione ao menos um id_trecho_qualidade.';
    return;
  }

  const classifierName = classifierNameInput.value.trim();
  const attributeValue = classifierToggle.checked ? classifierName : '';

  if (classifierToggle.checked && !classifierName) {
    feedback.textContent = 'Informe o valor de nome_do_classificador.';
    return;
  }

  try {
    const response = await fetch('/api/update-attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids,
        attributeName: ATTRIBUTE_NAME,
        attributeValue
      })
    });

    if (!response.ok) {
      const errorPayload = await response.json();
      throw new Error(errorPayload.error || 'Falha ao salvar alterações.');
    }

    const result = await response.json();
    feedback.textContent = `Atualização concluída: ${result.updatedCount} trecho(s) salvo(s) no osm.json com atributo paviment.`;
    selectedTrechos.clear();
    refreshCurrentView(false);
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

  classifierNameInput.disabled = !classifierToggle.checked;

  if (logradouros.length > 0) {
    renderFilteredData(logradouros[0]);
  } else {
    feedback.textContent = 'Nenhum logradouro encontrado no arquivo.';
  }
}

init();
