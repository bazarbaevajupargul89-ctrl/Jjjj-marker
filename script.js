const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const storageKey = 'jetisyTaxiOrders';
let selectedType = 'standard';

const getOrders = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
const saveOrders = (orders) => localStorage.setItem(storageKey, JSON.stringify(orders));
const showToast = (message) => { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3500); };

$('#from').addEventListener('input', (e) => { $('#fromPreview').textContent = e.target.value || 'Қайдан мекенжайы'; });
$('#to').addEventListener('input', (e) => { $('#toPreview').textContent = e.target.value || 'Қайда мекенжайы'; });

$$('.ride').forEach((button) => button.addEventListener('click', () => {
  $$('.ride').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  selectedType = button.dataset.type;
  $('#price').textContent = selectedType === 'comfort' ? '₸ 1 600 — 2 100' : '₸ 1 200 — 1 600';
}));

$('#orderForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const order = { id: Date.now(), from: $('#from').value, to: $('#to').value, phone: $('#phone').value, passengers: $('#passengers').value, type: selectedType === 'comfort' ? 'Комфорт' : 'Стандарт', price: $('#price').textContent, status: 'Жаңа', time: new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' }) };
  const orders = [order, ...getOrders()]; saveOrders(orders); renderOrders(); event.target.reset(); $('#fromPreview').textContent = 'Қайдан мекенжайы'; $('#toPreview').textContent = 'Қайда мекенжайы'; showToast('Тапсырыс қабылданды! Диспетчер сізге қоңырау шалады.'); $('#history').scrollIntoView({ behavior: 'smooth' });
});

function renderOrders() {
  const orders = getOrders(); $('#orderCount').textContent = `${orders.length} тапсырыс`;
  if (!orders.length) { $('#ordersList').innerHTML = '<div class="empty">Әзірге тапсырыс жоқ. Клиент формасын толтырып көріңіз.</div>'; return; }
  $('#ordersList').innerHTML = orders.map((order) => `<div class="order-row"><div><strong>#${String(order.id).slice(-4)}</strong><small>${order.time}</small></div><div><strong>${order.from}</strong><small>↓ ${order.to}</small></div><div><strong>${order.price}</strong><small>${order.type} · ${order.phone}</small></div><button class="${order.status === 'Қабылданды' ? 'accepted' : ''}" data-id="${order.id}">${order.status === 'Қабылданды' ? 'Қабылданды ✓' : 'Қабылдау'}</button></div>`).join('');
  $$('.order-row button').forEach((button) => button.addEventListener('click', () => { const orders = getOrders().map((order) => order.id === Number(button.dataset.id) ? { ...order, status: 'Қабылданды' } : order); saveOrders(orders); renderOrders(); showToast('Тапсырыс жүргізушіге жіберілді.'); }));
}

$('#clearOrders').addEventListener('click', () => { saveOrders([]); renderOrders(); showToast('Тапсырыстар тізімі тазартылды.'); });
$('#callBtn').addEventListener('click', () => { window.location.href = 'tel:+77070007070'; });
renderOrders();
