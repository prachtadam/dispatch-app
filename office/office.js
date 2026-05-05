const supabaseUrl = 'SUPABASE_URL';
const supabaseKey = 'SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const sections = {
  users: {
    title: 'Users',
    table: 'users',
    columns: ['id', 'name', 'pin'],
    form: [
      { label: 'Name', key: 'name', type: 'text' },
      { label: 'PIN', key: 'pin', type: 'text' }
    ]
  },
  trucks: {
    title: 'Trucks',
    table: 'trucks',
    columns: ['id', 'name'],
    form: [
      { label: 'Truck Name', key: 'name', type: 'text' }
    ]
  },
  customers: {
    title: 'Customers',
    table: 'customers',
    columns: ['id', 'name', 'phone'],
    form: [
      { label: 'Name', key: 'name', type: 'text' },
      { label: 'Phone', key: 'phone', type: 'text' }
    ]
  },
  fields: {
    title: 'Fields',
    table: 'fields',
    columns: ['id', 'name', 'customer_name'],
    form: [
      { label: 'Field Name', key: 'name', type: 'text' },
      { label: 'Customer', key: 'customer_id', type: 'select', relation: 'customers' }
    ]
  },
  job_types: {
    title: 'Job Types',
    table: 'job_types',
    columns: ['id', 'name', 'color'],
    form: [
      { label: 'Job Type', key: 'name', type: 'text' },
      { label: 'Color', key: 'color', type: 'text' }
    ]
  },
  jobs: {
    title: 'Jobs',
    table: 'jobs',
    columns: ['id', 'title', 'status', 'customer_name', 'field_name', 'job_type_name'],
    form: [
      { label: 'Job Title', key: 'title', type: 'text' },
      { label: 'Customer', key: 'customer_id', type: 'select', relation: 'customers' },
      { label: 'Field', key: 'field_id', type: 'select', relation: 'fields' },
      { label: 'Job Type', key: 'job_type_id', type: 'select', relation: 'job_types' },
      { label: 'Status', key: 'status', type: 'text' }
    ]
  }
};

let currentSection = 'users';
let relationships = {};

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.addEventListener('click', () => selectSection(button.dataset.section));
  });
  await loadRelationships();
  await renderSection();
});

async function loadRelationships() {
  const relationKeys = ['customers', 'fields', 'job_types'];
  for (const key of relationKeys) {
    const { data } = await supabase.from(key).select('*').order('id');
    relationships[key] = data || [];
  }
}

async function selectSection(sectionKey) {
  currentSection = sectionKey;
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.section === sectionKey);
  });
  document.getElementById('section-title').textContent = sections[sectionKey].title;
  document.getElementById('status-message').textContent = '';
  await renderSection();
}

async function renderSection() {
  const content = document.getElementById('section-body');
  const config = sections[currentSection];
  const list = await fetchRecords(config);
  content.innerHTML = `
    <div class="panel">
      <h2>${config.title}</h2>
      <div class="table-wrapper">
        ${renderTable(config, list)}
      </div>
    </div>
    <div class="panel">
      <h2>Add New ${config.title.slice(0, -1)}</h2>
      ${renderForm(config)}
    </div>
  `;
}

async function fetchRecords(config) {
  const table = supabase.from(config.table);
  let query = null;

  if (currentSection === 'fields') {
    query = table.select('id,name,customer_id,customers(name)').order('id');
  } else if (currentSection === 'jobs') {
    query = table.select('id,title,status,customer_id,field_id,job_type_id,customers(name),fields(name),job_types(name)').order('id');
  } else {
    query = table.select('*').order('id');
  }

  const { data, error } = await query;
  if (error) {
    document.getElementById('status-message').textContent = `Unable to load ${config.title}.`;
    return [];
  }
  return data || [];
}

function renderTable(config, records) {
  const headers = config.columns.map((column) => `<th>${formatHeader(column)}</th>`).join('');
  const rows = records.map((record) => {
    const values = config.columns.map((column) => {
      if (column === 'customer_name') return record.customers?.name || record.customer_name || '';
      if (column === 'field_name') return record.fields?.name || record.field_name || '';
      if (column === 'job_type_name') return record.job_types?.name || record.job_type_name || '';
      return record[column] ?? '';
    }).map((value) => `<td>${value}</td>`).join('');
    return `<tr>${values}</tr>`;
  }).join('');

  return `
    <table>
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderForm(config) {
  const inputs = config.form.map((field) => {
    if (field.type === 'select') {
      const options = relationships[field.relation] || [];
      const choices = options.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
      return `
        <label>${field.label}</label>
        <select id="field-${field.key}">
          <option value="">Select ${field.label}</option>
          ${choices}
        </select>
      `;
    }
    return `
      <label>${field.label}</label>
      <input id="field-${field.key}" type="${field.type}" />
    `;
  }).join('');

  return `
    <div class="form-row">${inputs}</div>
    <button class="primary" onclick="submitForm()">Add ${config.title.slice(0, -1)}</button>
  `;
}

async function submitForm() {
  const config = sections[currentSection];
  const values = {};
  for (const field of config.form) {
    const element = document.getElementById(`field-${field.key}`);
    values[field.key] = element.value;
  }

  const payload = {};
  for (const field of config.form) {
    if (field.type === 'select') {
      payload[field.key] = parseInt(values[field.key], 10) || null;
    } else {
      payload[field.key] = values[field.key];
    }
  }

  const { error } = await supabase.from(config.table).insert([payload]);
  if (error) {
    document.getElementById('status-message').textContent = `Unable to add ${config.title.slice(0, -1)}.`;
    return;
  }

  document.getElementById('status-message').textContent = `${config.title.slice(0, -1)} added successfully.`;
  await loadRelationships();
  await renderSection();
}

function formatHeader(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
