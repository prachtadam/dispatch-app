const users = [
  { id: 1, name: 'Ava', pin: '1111' },
  { id: 2, name: 'Blake', pin: '2222' },
  { id: 3, name: 'Jordan', pin: '3333' }
];

const trucks = [
  { id: 1, name: 'Truck 1' },
  { id: 2, name: 'Truck 2' },
  { id: 3, name: 'Truck 3' }
];

let jobs = [];

const products = [
  { name: 'Replacement Filter', sku: 'P-101', quantity: 14 },
  { name: 'Circuit Breaker', sku: 'P-112', quantity: 7 },
  { name: 'Spark Plug', sku: 'P-130', quantity: 12 }
];

const supplies = [
  { name: 'Zip Ties', quantity: 120 },
  { name: 'Electrical Tape', quantity: 26 },
  { name: 'Lubricant', quantity: 8 }
];

const tools = [
  { name: 'Multimeter' },
  { name: 'Cordless Drill' },
  { name: 'Inspection Camera' }
];

// Supabase configuration - replace with your actual values
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let homeSection = 'open';
let currentStatus = 'Idle';
let selectedJobId = null;
let selectedTruck = null;
let selectedHelpers = [];

async function login() {
  const name = document.getElementById('name').value.trim();
  const pin = document.getElementById('pin').value.trim();
  const errorField = document.getElementById('login-error');
  const user = users.find((item) => item.name.toLowerCase() === name.toLowerCase() && item.pin === pin);

  if (!user) {
    errorField.innerText = 'Login failed. Check name and PIN.';
    return;
  }

  currentUser = user;
  errorField.innerText = '';
  selectedHelpers = [currentUser.id];
  showScreen('truck-selection-screen');
  renderTruckSelection();
}

function logout() {
  currentUser = null;
  selectedJobId = null;
  selectedTruck = null;
  selectedHelpers = [];
  document.getElementById('name').value = '';
  document.getElementById('pin').value = '';
  showScreen('login-screen');
}

function renderTruckSelection() {
  const truckSelect = document.getElementById('truck-select');
  truckSelect.innerHTML = trucks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  const helpersList = document.getElementById('helpers-list');
  helpersList.innerHTML = users.map(u => `
    <div class="helper-item">
      <input type="checkbox" id="helper-${u.id}" ${selectedHelpers.includes(u.id) ? 'checked' : ''} onchange="toggleHelper(${u.id})">
      <label for="helper-${u.id}">${u.name}</label>
    </div>
  `).join('');
}

function toggleHelper(id) {
  if (selectedHelpers.includes(id)) {
    selectedHelpers = selectedHelpers.filter(h => h !== id);
  } else {
    selectedHelpers.push(id);
  }
}

function continueToHome() {
  selectedTruck = trucks.find(t => t.id == document.getElementById('truck-select').value);
  const lowStock = products.some(p => p.quantity < 5);
  showScreen('home-screen');
  if (lowStock) {
    setHomeSection('restock');
  } else {
    setHomeSection('open');
  }
  renderTruckInfo();
  loadJobs(); // load jobs after selection
}

function renderTruckInfo() {
  document.getElementById('truck-id').textContent = selectedTruck.name;
  const techName = currentUser.name;
  const helpersNames = selectedHelpers.filter(id => id !== currentUser.id).map(id => users.find(u => u.id === id).name).join(', ');
  document.getElementById('tech-info').innerHTML = `Tech: ${techName}<br>Helpers: ${helpersNames}`;
}

function showTruckSelection() {
  showScreen('truck-selection-screen');
  renderTruckSelection();
}

function showHome() {
  setHomeSection('open');
}

function addJob() {
  // placeholder
}

async function loadJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id,
      status,
      created_at,
      customers (name),
      fields (name),
      job_types (name, color)
    `);

  if (error) {
    console.error('Error loading jobs:', error);
    return;
  }

  jobs = data;
  renderJobLists();
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === screenId);
  });
}

function setHomeSection(section) {
  homeSection = section;
  document.getElementById('home-open').classList.toggle('hidden', section !== 'open');
  document.getElementById('home-my').classList.toggle('hidden', section !== 'my');
  document.getElementById('home-map').classList.toggle('hidden', section !== 'map');
  document.getElementById('home-restock').classList.toggle('hidden', section !== 'restock');
  if (section === 'restock') {
    renderRestock();
  }
}

function setTimeStatus(status) {
  currentStatus = status;
  renderTimeStatus();
  notify(`${status} time tracked.`);
}

function renderAll() {
  renderJobLists();
  renderMap();
  renderInventorySummary();
  renderTimeStatus();
  if (selectedJobId !== null) {
    renderRepairDetail();
  }
}

function renderGreeting() {
  document.getElementById('user-greeting').innerText = currentUser ? `Tech: ${currentUser.name}` : '';
}

function renderTabs() {
  setHomeSection(homeSection);
}

function renderJobLists() {
  const openJobsList = document.getElementById('open-jobs-list');
  const myJobsList = document.getElementById('my-jobs-list');

  // Group jobs by status and sort by created_at ascending
  const groupedJobs = {
    open: jobs.filter(job => job.status === 'open').sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    in_progress: jobs.filter(job => job.status === 'in_progress').sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    paused: jobs.filter(job => job.status === 'paused').sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  };

  openJobsList.innerHTML = `
    <div class="job-group">
      <h3>Open Jobs</h3>
      ${groupedJobs.open.length ? groupedJobs.open.map(job => renderJobCard(job, false)).join('') : '<p class="detail-note">No open jobs.</p>'}
    </div>
    <div class="job-group">
      <h3>In Progress</h3>
      ${groupedJobs.in_progress.length ? groupedJobs.in_progress.map(job => renderJobCard(job, false)).join('') : '<p class="detail-note">No jobs in progress.</p>'}
    </div>
    <div class="job-group">
      <h3>Paused Jobs</h3>
      ${groupedJobs.paused.length ? groupedJobs.paused.map(job => renderJobCard(job, false)).join('') : '<p class="detail-note">No paused jobs.</p>'}
    </div>
  `;

  const myJobs = jobs
    .filter((job) => job.assignedTech && job.assignedTech.includes(currentUser.id) && job.status !== 'completed')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  myJobsList.innerHTML = myJobs.length
    ? myJobs.map((job) => renderJobCard(job, true)).join('')
    : '<p class="detail-note">No jobs assigned yet.</p>';
}

function renderRestock() {
  const restockList = document.getElementById('restock-list');
  restockList.innerHTML = products.map(p => `
    <div class="restock-item">
      <span>${p.name}</span>
      <input type="number" value="${p.quantity}" onchange="updateStock('${p.sku}', this.value)">
    </div>
  `).join('');
}

function updateStock(sku, qty) {
  const product = products.find(p => p.sku === sku);
  product.quantity = parseInt(qty);
}

function renderJobCard(job, isMyJob) {
  let actions = '';
  const statusClass = `status-pill status-${job.status.replace('_', '-')}`;

  if (job.status === 'open') {
    actions = `<button class="primary-button" onclick="takeJob(${job.id})">Take Job</button>`;
  }

  return `
    <div class="job-card">
      <div class="top-row">
        <div>
          <div class="job-title" style="color: ${job.job_types.color}">${job.job_types.name}</div>
          <div class="detail-note">${job.customers.name} · ${job.fields.name}</div>
        </div>
        <span class="${statusClass}">${job.status.replace('_', ' ')}</span>
      </div>
      <div class="detail-note">Oldest first · ${formatAge(job.created_at)}</div>
      <div class="job-actions">${actions}</div>
    </div>
  `;
}

function formatAge(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function takeJob(jobId) {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  if (!job.assignedTech.includes(currentUser.id)) {
    job.assignedTech.push(currentUser.id);
  }
  if (job.status === 'Open') {
    job.status = 'Driving';
  }
  renderAll();
  openRepair(jobId);
  notify('Job taken. Status set to Driving.');
}

function arriveJob(jobId) {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  job.status = 'On Site';
  renderAll();
  notify('Arrived on site.');
}

function completeJob(jobId) {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  job.status = 'Completed';
  renderAll();
  notify('Job completed.');
}

function openRepair(jobId) {
  selectedJobId = jobId;
  showScreen('repair-screen');
  renderRepairDetail();
}

function closeRepair() {
  selectedJobId = null;
  showScreen('home-screen');
  renderAll();
}

function renderRepairDetail() {
  const job = jobs.find((item) => item.id === selectedJobId);
  if (!job) return;

  document.getElementById('repair-job-title').innerText = job.title;
  document.getElementById('repair-job-address').innerText = job.address;
  document.getElementById('repair-job-status').innerText = job.status;
  document.getElementById('repair-job-techs').innerText = job.assignedTech
    .map((id) => users.find((user) => user.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const summary = [];

  if (job.repairs.parts.length) {
    summary.push(`<div class="summary-item"><strong>Parts</strong><ul>${job.repairs.parts.map((item) => `<li>${item.qty} × ${item.name}</li>`).join('')}</ul></div>`);
  }
  if (job.repairs.services.length) {
    summary.push(`<div class="summary-item"><strong>Services</strong><ul>${job.repairs.services.map((item) => `<li>${item}</li>`).join('')}</ul></div>`);
  }
  if (job.repairs.charges.length) {
    summary.push(`<div class="summary-item"><strong>Charges</strong><ul>${job.repairs.charges.map((item) => `<li>${item.desc}: $${item.amt.toFixed(2)}</li>`).join('')}</ul></div>`);
  }
  if (job.repairs.expenses.length) {
    summary.push(`<div class="summary-item"><strong>Expenses</strong><ul>${job.repairs.expenses.map((item) => `<li>${item.desc}: $${item.amt.toFixed(2)}</li>`).join('')}</ul></div>`);
  }

  document.getElementById('repair-summary').innerHTML = summary.length > 0
    ? summary.join('')
    : '<p class="detail-note">No work items added yet.</p>';
}

function addRepairLine(type) {
  const job = jobs.find((item) => item.id === selectedJobId);
  if (!job) return;

  if (type === 'part') {
    const name = document.getElementById('part-name').value.trim();
    const qty = Number(document.getElementById('part-qty').value);
    if (!name || qty < 1) {
      notify('Enter part and quantity.');
      return;
    }
    job.repairs.parts.push({ name, qty });
    document.getElementById('part-name').value = '';
    document.getElementById('part-qty').value = 1;
  }

  if (type === 'service') {
    const name = document.getElementById('service-name').value.trim();
    const amt = Number(document.getElementById('service-price').value);
    if (!name) {
      notify('Enter service description.');
      return;
    }
    job.repairs.services.push(name + (amt > 0 ? ` ($${amt.toFixed(2)})` : ''));
    document.getElementById('service-name').value = '';
    document.getElementById('service-price').value = 0;
  }

  if (type === 'charge') {
    const desc = document.getElementById('charge-desc').value.trim();
    const amt = Number(document.getElementById('charge-amt').value);
    if (!desc || amt < 0) {
      notify('Enter charge description and amount.');
      return;
    }
    job.repairs.charges.push({ desc, amt });
    document.getElementById('charge-desc').value = '';
    document.getElementById('charge-amt').value = 0;
  }

  if (type === 'expense') {
    const desc = document.getElementById('expense-desc').value.trim();
    const amt = Number(document.getElementById('expense-amt').value);
    if (!desc || amt < 0) {
      notify('Enter expense description and amount.');
      return;
    }
    job.repairs.expenses.push({ desc, amt });
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amt').value = 0;
  }

  renderRepairDetail();
  notify('Work item added.');
}

function renderMap() {
  const mapContent = document.getElementById('map-content');
  const activeJobs = jobs.filter((job) => job.status !== 'Completed');
  const lines = activeJobs.map((job) => `• ${job.location}: ${job.title} (${job.status})`).join('<br>');
  mapContent.innerHTML = `
    <p><strong>Nearby work:</strong></p>
    <p>${lines || 'No active jobs available.'}</p>
  `;
}

function renderInventorySummary() {
  document.getElementById('inventory-products').innerText = products.length;
  document.getElementById('inventory-supplies').innerText = supplies.length;
  document.getElementById('inventory-tools').innerText = tools.length;
  document.getElementById('inventory-assigned').innerText = jobs.filter((job) => job.assignedTech.includes(currentUser.id) && job.status !== 'Completed').length;
}

function renderTimeStatus() {
  document.getElementById('current-status').innerText = currentStatus;
}

function notify(message) {
  const toast = document.getElementById('login-error');
  toast.innerText = message;
  if (!message) return;
  setTimeout(() => {
    if (toast.innerText === message) {
      toast.innerText = '';
    }
  }, 2200);
}

document.addEventListener('DOMContentLoaded', () => {
  showScreen('login-screen');
  renderTimeStatus();
});
