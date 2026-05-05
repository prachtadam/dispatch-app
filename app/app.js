const supabaseUrl = 'SUPABASE_URL';
const supabaseKey = 'SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const users = [
  { id: 1, name: 'Ava', pin: '1111' },
  { id: 2, name: 'Blake', pin: '2222' },
  { id: 3, name: 'Jordan', pin: '3333' }
];

function login() {
  const name = document.getElementById('login-name').value.trim();
  const pin = document.getElementById('login-pin').value.trim();
  const errorField = document.getElementById('login-error');
  const user = users.find((item) => item.name.toLowerCase() === name.toLowerCase() && item.pin === pin);

  if (!user) {
    errorField.textContent = 'Login failed. Check name and PIN.';
    return;
  }

  errorField.textContent = '';
  document.getElementById('tech-name').textContent = user.name;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('placeholder-screen').classList.remove('hidden');
}

function logout() {
  document.getElementById('login-name').value = '';
  document.getElementById('login-pin').value = '';
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('placeholder-screen').classList.add('hidden');
}
