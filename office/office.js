const supabaseUrl = 'SUPABASE_URL';
const supabaseKey = 'SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const sections = {
  customers: {
    title: 'Customers',
    table: 'customers'
  },
  fields: {
    title: 'Fields',
    table: 'fields'
  },
  job_types: {
    title: 'Job Types',
    table: 'job_types'
  },
  jobs: {
    title: 'Jobs',
    table: 'jobs'
  }
};

let currentSection = 'customers';
let customers = [];
let fields = [];
let jobTypes = [];
let jobs = [];

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.addEventListener('click', () => selectSection(button.dataset.section));
  });
  await refreshData();
  await selectSection(currentSection);
});

async function refreshData() {
  await Promise.all([loadCustomers(), loadFields(), loadJobTypes(), loadJobs()]);
}

async function loadCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('id');
  customers = error ? [] : data || [];
}

async function loadFields() {
  const { data, error } = await supabase
    .from('fields')
    .select('id,name,customer_id,customers(name)')
    .order('id');
  fields = error ? [] : data || [];
}

async function loadJobTypes() {
  const { data, error } = await supabase.from('job_types').select('*').order('id');
  jobTypes = error ? [] : data || [];
}

async function loadJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('id,description,status,customer_id,field_id,job_type_id,customers(name),fields(name),job_types(name)')
    .order('id');
  jobs = error ? [] : data || [];
}

async function selectSection(sectionKey) {
  currentSection = sectionKey;
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.section === sectionKey);
  });
  document.getElementById('section-title').textContent = sections[sectionKey].title;
  setStatus('');
  renderSection();
}

function renderSection() {
  const content = document.getElementById('section-body');

  switch (currentSection) {
    case 'customers':
      content.innerHTML = renderCustomersSection();
      break;
    case 'fields':
      content.innerHTML = renderFieldsSection();
      break;
    case 'job_types':
      content.innerHTML = renderJobTypesSection();
      break;
    case 'jobs':
      content.innerHTML = renderJobsSection();
      break;
    default:
      content.innerHTML = '<div class="panel"><p>Section not found.</p></div>';
  }
}

function renderCustomersSection() {
  return `
    <div class="panel">
      <h2>Customers</h2>
      <div class="table-wrapper">${renderCustomerTable()}</div>
    </div>
    <div class="panel">
      <h2>Add Customer</h2>
      <div class="form-row">
        <div>
          <label>Name</label>
          <input id="customer-name" type="text" placeholder="Customer name" />
        </div>
        <div>
          <label>Phone</label>
          <input id="customer-phone" type="text" placeholder="(555) 123-4567" />
        </div>
      </div>
      <button class="primary" onclick="submitCustomer()">Save Customer</button>
    </div>
  `;
}

function renderFieldsSection() {
  return `
    <div class="panel">
      <h2>Fields</h2>
      <div class="table-wrapper">${renderFieldTable()}</div>
    </div>
    <div class="panel">
      <h2>Add Field</h2>
      <div class="form-row">
        <div>
          <label>Field Name</label>
          <input id="field-name" type="text" placeholder="Field name" />
        </div>
        <div>
          <label>Customer</label>
          <select id="field-customer">
            <option value="">Select customer</option>
            ${customers.map((customer) => `<option value="${customer.id}">${customer.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="primary" onclick="submitField()">Save Field</button>
    </div>
  `;
}

function renderJobTypesSection() {
  return `
    <div class="panel">
      <h2>Job Types</h2>
      <div class="table-wrapper">${renderJobTypeTable()}</div>
    </div>
    <div class="panel">
      <h2>Add Job Type</h2>
      <div class="form-row">
        <div>
          <label>Name</label>
          <input id="job-type-name" type="text" placeholder="Job type name" />
        </div>
        <div>
          <label>Color</label>
          <input id="job-type-color" type="text" placeholder="#34d399" />
        </div>
      </div>
      <button class="primary" onclick="submitJobType()">Save Job Type</button>
    </div>
  `;
}

function renderJobsSection() {
  return `
    <div class="panel">
      <h2>Jobs</h2>
      <div class="table-wrapper">${renderJobTable()}</div>
    </div>
    <div class="panel">
      <h2>Add Job</h2>
      <div class="form-row">
        <div>
          <label>Customer</label>
          <select id="job-customer" onchange="updateJobFieldOptions()">
            <option value="">Select customer</option>
            ${customers.map((customer) => `<option value="${customer.id}">${customer.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Field</label>
          <select id="job-field" disabled>
            <option value="">Select field</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div>
          <label>Job Type</label>
          <select id="job-job-type">
            <option value="">Select job type</option>
            ${jobTypes.map((type) => `<option value="${type.id}">${type.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Description</label>
          <input id="job-description" type="text" placeholder="Job description" />
        </div>
      </div>
      <button class="primary" onclick="submitJob()">Save Job</button>
    </div>
  `;
}

function renderCustomerTable() {
  if (!customers.length) {
    return '<p>No customers found.</p>';
  }
  const rows = customers.map((customer) => `
    <tr>
      <td>${customer.id}</td>
      <td>${customer.name}</td>
      <td>${customer.phone || ''}</td>
    </tr>
  `).join('');
  return `
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Phone</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderFieldTable() {
  if (!fields.length) {
    return '<p>No fields found.</p>';
  }
  const rows = fields.map((field) => `
    <tr>
      <td>${field.id}</td>
      <td>${field.name}</td>
      <td>${field.customers?.name || ''}</td>
    </tr>
  `).join('');
  return `
    <table>
      <thead><tr><th>ID</th><th>Field</th><th>Customer</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderJobTypeTable() {
  if (!jobTypes.length) {
    return '<p>No job types found.</p>';
  }
  const rows = jobTypes.map((type) => `
    <tr>
      <td>${type.id}</td>
      <td>${type.name}</td>
      <td>${type.color || ''}</td>
    </tr>
  `).join('');
  return `
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Color</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderJobTable() {
  if (!jobs.length) {
    return '<p>No jobs found.</p>';
  }
  const rows = jobs.map((job) => `
    <tr>
      <td>${job.id}</td>
      <td>${job.description || ''}</td>
      <td>${job.customers?.name || ''}</td>
      <td>${job.fields?.name || ''}</td>
      <td>${job.job_types?.name || ''}</td>
      <td>${job.status || ''}</td>
    </tr>
  `).join('');
  return `
    <table>
      <thead><tr><th>ID</th><th>Description</th><th>Customer</th><th>Field</th><th>Job Type</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function submitCustomer() {
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();

  if (!name) {
    setStatus('Customer name is required.', 'error');
    return;
  }

  const { error } = await supabase.from('customers').insert([{ name, phone }]);
  if (error) {
    setStatus('Unable to save customer.', 'error');
    return;
  }

  await refreshData();
  setStatus('Customer added successfully.', 'success');
  selectSection('customers');
}

async function submitField() {
  const name = document.getElementById('field-name').value.trim();
  const customerId = parseInt(document.getElementById('field-customer').value, 10);

  if (!name || !customerId) {
    setStatus('Field name and customer are required.', 'error');
    return;
  }

  const { error } = await supabase.from('fields').insert([{ name, customer_id: customerId }]);
  if (error) {
    setStatus('Unable to save field.', 'error');
    return;
  }

  await refreshData();
  setStatus('Field added successfully.', 'success');
  selectSection('fields');
}

async function submitJobType() {
  const name = document.getElementById('job-type-name').value.trim();
  const color = document.getElementById('job-type-color').value.trim();

  if (!name) {
    setStatus('Job type name is required.', 'error');
    return;
  }

  const { error } = await supabase.from('job_types').insert([{ name, color }]);
  if (error) {
    setStatus('Unable to save job type.', 'error');
    return;
  }

  await refreshData();
  setStatus('Job type added successfully.', 'success');
  selectSection('job_types');
}

async function submitJob() {
  const customerId = parseInt(document.getElementById('job-customer').value, 10);
  const fieldId = parseInt(document.getElementById('job-field').value, 10);
  const jobTypeId = parseInt(document.getElementById('job-job-type').value, 10);
  const description = document.getElementById('job-description').value.trim();

  if (!customerId || !fieldId || !jobTypeId || !description) {
    setStatus('All job fields are required.', 'error');
    return;
  }

  const { error } = await supabase.from('jobs').insert([{ customer_id: customerId, field_id: fieldId, job_type_id: jobTypeId, description, status: 'open' }]);
  if (error) {
    setStatus('Unable to save job.', 'error');
    return;
  }

  await refreshData();
  setStatus('Job added successfully.', 'success');
  selectSection('jobs');
}

function updateJobFieldOptions() {
  const customerId = parseInt(document.getElementById('job-customer').value, 10);
  const fieldSelect = document.getElementById('job-field');

  if (!customerId) {
    fieldSelect.innerHTML = '<option value="">Select field</option>';
    fieldSelect.disabled = true;
    return;
  }

  const options = fields.filter((field) => field.customer_id === customerId);
  fieldSelect.innerHTML = `
    <option value="">Select field</option>
    ${options.map((field) => `<option value="${field.id}">${field.name}</option>`).join('')}
  `;
  fieldSelect.disabled = options.length === 0;
}

function setStatus(message, type) {
  const status = document.getElementById('status-message');
  status.textContent = message;
  status.className = `status-message ${type === 'success' ? 'message-success' : 'message-error'}`;
}
