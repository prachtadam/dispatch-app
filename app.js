const users = [
  { id: 1, name: 'Ava', pin: '1111' },
  { id: 2, name: 'Blake', pin: '2222' },
  { id: 3, name: 'Jordan', pin: '3333' }
];

const jobs = [
  {
    id: 101,
    title: 'AC Condenser Repair',
    address: '124 Oak Street',
    status: 'Open',
    createdAt: '2026-04-28T08:10:00Z',
    assignedTech: [],
    location: 'Northside',
    repairs: { parts: [], services: [], charges: [], expenses: [] }
  },
  {
    id: 102,
    title: 'Roof Leak Service',
    address: '55 Maple Avenue',
    status: 'Open',
    createdAt: '2026-04-29T09:35:00Z',
    assignedTech: [],
    location: 'Downtown',
    repairs: { parts: [], services: [], charges: [], expenses: [] }
  },
  {
    id: 103,
    title: 'Generator Tune-Up',
    address: '9 Pine Drive',
    status: 'Driving',
    createdAt: '2026-04-27T07:20:00Z',
    assignedTech: [2],
    location: 'South Park',
    repairs: { parts: [{ name: 'Spark Plug', qty: 2 }], services: [], charges: [], expenses: [] }
  },
  {
    id: 104,
    title: 'Panel Replacement',
    address: '300 Birch Road',
    status: 'Paused',
    createdAt: '2026-04-25T11:05:00Z',
    assignedTech: [1, 3],
    location: 'West End',
    repairs: { parts: [{ name: 'Breaker', qty: 1 }], services: ['Safety Inspection'], charges: [{ desc: 'Permit fee', amt: 35 }], expenses: [] }
  },
  {
    id: 105,
    title: 'Camera System Install',
    address: '72 Cedar Lane',
    status: 'Completed',
    createdAt: '2026-04-20T12:40:00Z',
    assignedTech: [1],
    location: 'East Hills',
    repairs: { parts: [{ name: 'Camera Head', qty: 3 }], services: ['System Calibration'], charges: [], expenses: [{ desc: 'Mounting brackets', amt: 12 }] }
  }
];

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

let currentUser = null;
let homeSection = 'open';
let currentStatus = 'Idle';
let selectedJobId = null;

function login() {
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
  homeSection = 'open';
  selectedJobId = null;
  showScreen('home-screen');
  renderAll();
}

function logout() {
  currentUser = null;
  selectedJobId = null;
  document.getElementById('name').value = '';
  document.getElementById('pin').value = '';
  showScreen('login-screen');
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === screenId);
  });
}

function setHomeSection(section) {
  homeSection = section;
  document.getElementById('tab-open').classList.toggle('active', section === 'open');
  document.getElementById('tab-my').classList.toggle('active', section === 'my');
  document.getElementById('tab-map').classList.toggle('active', section === 'map');
  document.getElementById('home-open').classList.toggle('hidden', section !== 'open');
  document.getElementById('home-my').classList.toggle('hidden', section !== 'my');
  document.getElementById('home-map').classList.toggle('hidden', section !== 'map');
}

function setTimeStatus(status) {
  currentStatus = status;
  renderTimeStatus();
  notify(`${status} time tracked.`);
}

function renderAll() {
  renderGreeting();
  renderTabs();
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

  const openJobs = jobs
    .filter((job) => job.status === 'Open')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  openJobsList.innerHTML = openJobs.length
    ? openJobs.map((job) => renderJobCard(job, false)).join('')
    : '<p class="detail-note">No open jobs at the moment.</p>';

  const myJobs = jobs
    .filter((job) => job.assignedTech.includes(currentUser.id) && job.status !== 'Completed')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  myJobsList.innerHTML = myJobs.length
    ? myJobs.map((job) => renderJobCard(job, true)).join('')
    : '<p class="detail-note">No jobs assigned yet.</p>';
}

function renderJobCard(job, isMyJob) {
  const techCount = job.assignedTech.length;
  let actions = '';
  const statusClass = `status-pill status-${job.status.replace(' ', '\\ ')}`;

  if (!isMyJob) {
    actions = `<button class="primary-button" onclick="takeJob(${job.id})">Take Job</button>`;
  } else {
    if (job.status === 'Driving') {
      actions = `<button class="primary-button" onclick="arriveJob(${job.id})">Arrived</button>`;
    }
    if (job.status === 'On Site' || job.status === 'Driving' || job.status === 'Paused') {
      actions += `<button class="secondary-button" onclick="openRepair(${job.id})">Repair</button>`;
      if (job.status !== 'Completed') {
        actions += `<button class="primary-button" onclick="completeJob(${job.id})">Complete</button>`;
      }
    }
  }

  return `
    <div class="job-card">
      <div class="top-row">
        <div>
          <div class="job-title">${job.title}</div>
          <div class="detail-note">${job.address} · ${job.location}</div>
        </div>
        <span class="${statusClass}">${job.status}</span>
      </div>
      <div class="detail-note">Oldest first · ${formatAge(job.createdAt)} · ${techCount} tech${techCount === 1 ? '' : 's'}</div>
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
