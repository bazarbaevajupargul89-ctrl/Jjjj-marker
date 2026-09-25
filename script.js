const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const storageKey = 'jetisyTaxiOrders';
let selectedType = 'standard';
let map;
let fromMarker;
let toMarker;
let routeLine;

const getOrders = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
const saveOrders = (orders) => localStorage.setItem(storageKey, JSON.stringify(orders));
const showToast = (message) => { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3500); };

function initMap() {
  map = L.map('routeMap').setView([43.850, 77.000], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
}

async function geocode(address) {
  const query = `${address}, Алматы облысы, Қазақстан`;
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=kk&q=${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } });
  const data = await response.json();
  if (!data.length) throw new Error('Мекенжай табылмады');
  return [Number(data[0].lat), Number(data[0].lon)];
}

async function showRoute() {
  const from = $('#from').value.trim();
  const to = $('#to').value.trim();
  if (!from || !to) { showToast('Алдымен екі мекенжайды да енгізіңіз'); return; }
  const button = $('#showRoute');
  button.disabled = true; button.textContent = 'Карта жүктелуде…';
  try {
    const [fromPoint, toPoint] = await Promise.all([geocode(from), geocode(to)]);
    if (fromMarker) map.removeLayer(fromMarker);
    if (toMarker) map.removeLayer(toMarker);
    if (routeLine) map.removeLayer(routeLine);
    fromMarker = L.marker(fromPoint).addTo(map).bindPopup(`<b>Алу орны</b><br>${from}`).openPopup();
    toMarker = L.marker(toPoint).addTo(map).bindPopup(`<b>Бару орны</b><br>${to}`);
    routeLine = L.polyline([fromPoint, toPoint], { color: '#17231f', weight: 5, dashArray: '10 8' }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [35, 35] });
    $('#fromPreview').textContent = from; $('#toPreview').textContent = to;
    showToast('Маршрут картада көрсетілді');
  } catch (error) {
    showToast('Мекенжай табылмады. Қала/көше атауын нақты жазыңыз.');
  } finally { button.disabled = false; button.textContent = 'Картада көрсету'; }
}

function useMyLocation() {
  if (!navigator.geolocation) { showToast('Бұл браузер геолокацияны қолдамайды'); return; }
  navigator.geolocation.getCurrentPosition((position) => {
    const point = [position.coords.latitude, position.coords.longitude];
    map.setView(point, 15);
    if (fromMarker) map.removeLayer(fromMarker);
    fromMarker = L.marker(point).addTo(map).bindPopup('Сіздің орналасқан жеріңіз').openPopup();
    $('#from').value = 'Менің қазіргі орналасқан жерім'; $('#fromPreview').textContent = 'Менің қазіргі орналасқан жерім';
    showToast('Орналасқан жеріңіз картада белгіленді');
  }, () => showToast('Орналасқан жерді анықтауға рұқсат беріңіз'));
}

$('#from').addEventListener('input', (e) => { $('#fromPreview').textContent = e.target.value || 'Қайдан мекенжайы'; });
$('#to').addEventListener('input', (e) => { $('#toPreview').textContent = e.target.value || 'Қайда мекенжайы'; });
$('#showRoute').addEventListener('click', showRoute);
$('#myLocation').addEventListener('click', useMyLocation);

$$('.ride').forEach((button) => button.addEventListener('click', () => {
  $$('.ride').forEach((item) => item.classList.remove('active')); button.classList.add('active'); selectedType = button.dataset.type;
  $('#price').textContent = selectedType === 'comfort' ? '₸ 1 600 — 2 100' : '₸ 1 200 — 1 600';
}));

$('#orderForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const order = { id: Date.now(), from: $('#from').value, to: $('#to').value, phone: $('#phone').value, passengers: $('#passengers').value, type: selectedType === 'comfort' ? 'Комфорт' : 'Стандарт', price: $('#price').textContent, status: 'Жаңа', eta: '2–3 минут', time: new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' }) };
  saveOrders([order, ...getOrders()]); renderOrders(); event.target.reset(); $('#fromPreview').textContent = 'Қайдан мекенжайы'; $('#toPreview').textContent = 'Қайда мекенжайы'; showToast('Тапсырыс қабылданды! Жүргізуші 2–3 минутта келеді.'); $('#history').scrollIntoView({ behavior: 'smooth' });
});

function renderOrders() {
  const orders = getOrders(); $('#orderCount').textContent = `${orders.length} тапсырыс`;
  if (!orders.length) { $('#ordersList').innerHTML = '<div class="empty">Әзірге тапсырыс жоқ. Клиент формасын толтырып көріңіз.</div>'; return; }
  $('#ordersList').innerHTML = orders.map((order) => `<div class="order-row"><div><strong>#${String(order.id).slice(-4)}</strong><small>${order.time}</small></div><div><strong>${order.from}</strong><small>↓ ${order.to}</small></div><div><strong>${order.price}</strong><small>${order.type} · ${order.eta} · ${order.phone}</small></div><button class="${order.status === 'Қабылданды' ? 'accepted' : ''}" data-id="${order.id}">${order.status === 'Қабылданды' ? 'Қабылданды ✓' : 'Қабылдау'}</button></div>`).join('');
  $$('.order-row button').forEach((button) => button.addEventListener('click', () => { const orders = getOrders().map((order) => order.id === Number(button.dataset.id) ? { ...order, status: 'Қабылданды' } : order); saveOrders(orders); renderOrders(); showToast('Тапсырыс жүргізушіге жіберілді.'); }));
}

$('#clearOrders').addEventListener('click', () => { saveOrders([]); renderOrders(); showToast('Тапсырыстар тізімі тазартылды.'); });
$('#callBtn').addEventListener('click', () => { window.location.href = 'tel:+77070007070'; });
initMap(); renderOrders();
