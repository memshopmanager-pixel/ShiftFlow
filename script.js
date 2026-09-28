const today = new Date();
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const storeKey = 'shift-flow-data';
let records = JSON.parse(localStorage.getItem(storeKey) || '{}');

const $ = (id) => document.getElementById(id);
const calendarDays = $('calendarDays');
const monthLabel = $('monthLabel');
const shiftModal = $('shiftModal');
const agreementModal = $('agreementModal');
const shiftForm = $('shiftForm');
const shiftDate = $('shiftDate');
let selectedColor = 'blue';

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const formatDate = (key) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(`${key}T12:00:00`));
const save = () => localStorage.setItem(storeKey, JSON.stringify(records));
const currentRecord = () => records[dateKey(selectedDate)] || { shifts: [], holiday: false };

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  monthLabel.textContent = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(currentMonth).replace(/^./, (x) => x.toUpperCase());
  const start = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  calendarDays.innerHTML = '';
  for (let i = 0; i < start; i++) calendarDays.insertAdjacentHTML('beforeend', '<div class="day-cell empty"></div>');
  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    const record = records[key];
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    if (date.toDateString() === today.toDateString()) cell.classList.add('today');
    if (date.toDateString() === selectedDate.toDateString()) cell.classList.add('selected');
    if (record?.holiday) cell.classList.add('holiday-day');
    const colors = [...new Set((record?.shifts || []).map((s) => s.color))];
    cell.innerHTML = `<span class="day-number">${day}</span>${record?.holiday ? '<span class="holiday-mark">Выходной</span>' : ''}<span class="day-colors">${colors.map((c) => `<i class="mini-dot ${c}"></i>`).join('')}</span>`;
    cell.addEventListener('click', () => { selectedDate = date; renderCalendar(); renderSelectedDay(); openShiftModal(); });
    calendarDays.appendChild(cell);
  }
}

function renderSelectedDay() {
  const key = dateKey(selectedDate);
  const record = currentRecord();
  $('selectedDayTitle').textContent = formatDate(key);
  const list = $('shiftsListHome');
  list.innerHTML = '';
  if (record.holiday) list.insertAdjacentHTML('beforeend', '<div class="holiday-card">🌿 Выходной <button class="delete-button" data-delete-holiday>Удалить</button></div>');
  record.shifts.forEach((shift, index) => {
    list.insertAdjacentHTML('beforeend', `<article class="shift-card ${shift.color}"><span class="work-color ${shift.color}"></span><div class="shift-main"><strong>${escapeHtml(shift.name)}</strong><small>${shift.hours} ч · ${Number(shift.income).toLocaleString('ru-RU')} ₽</small>${shift.comment ? `<p>${escapeHtml(shift.comment)}</p>` : ''}</div><button class="delete-button" data-delete-shift="${index}" aria-label="Удалить смену">Удалить</button></article>`);
  });
  if (!record.shifts.length && !record.holiday) list.innerHTML = '<p class="empty-state">Нет смен. Нажмите на дату или «+ Смена», чтобы добавить.</p>';
  list.querySelector('[data-delete-holiday]')?.addEventListener('click', () => { delete records[key].holiday; save(); renderCalendar(); renderSelectedDay(); });
  list.querySelectorAll('[data-delete-shift]').forEach((button) => button.addEventListener('click', () => { record.shifts.splice(Number(button.dataset.deleteShift), 1); if (!record.shifts.length && !record.holiday) delete records[key]; save(); renderCalendar(); renderSelectedDay(); updateStats(); }));
  updateStats();
}

function updateStats() {
  const y = currentMonth.getFullYear(); const m = currentMonth.getMonth();
  let hours = 0; let income = 0; let count = 0;
  Object.entries(records).forEach(([key, value]) => { const d = new Date(`${key}T12:00:00`); if (d.getFullYear() === y && d.getMonth() === m) value.shifts.forEach((s) => { hours += Number(s.hours) || 0; income += Number(s.income) || 0; count++; }); });
  $('monthHours').textContent = hours; $('monthShifts').textContent = count; $('monthEarnings').textContent = `${income.toLocaleString('ru-RU')} ₽`;
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c])); }
function openShiftModal() { shiftDate.value = dateKey(selectedDate); shiftForm.reset(); shiftDate.value = dateKey(selectedDate); selectedColor = 'blue'; document.querySelectorAll('.color-dot').forEach((b) => b.classList.toggle('active', b.dataset.color === selectedColor)); shiftModal.classList.remove('hidden'); shiftModal.setAttribute('aria-hidden', 'false'); }
function closeShiftModal() { shiftModal.classList.add('hidden'); shiftModal.setAttribute('aria-hidden', 'true'); }
$('prevMonth').addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1); renderCalendar(); updateStats(); });
$('nextMonth').addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1); renderCalendar(); updateStats(); });
$('addShiftButton').addEventListener('click', openShiftModal); $('closeModal').addEventListener('click', closeShiftModal); shiftModal.addEventListener('click', (e) => { if (e.target === shiftModal) closeShiftModal(); });
document.querySelectorAll('.color-dot').forEach((button) => button.addEventListener('click', () => { selectedColor = button.dataset.color; document.querySelectorAll('.color-dot').forEach((b) => b.classList.toggle('active', b === button)); }));
shiftForm.addEventListener('submit', (e) => { e.preventDefault(); const key = shiftDate.value; if (!records[key]) records[key] = { shifts: [], holiday: false }; records[key].shifts.push({ name: $('shiftName').value.trim(), hours: $('shiftHours').value, income: $('shiftIncome').value, color: selectedColor, comment: $('shiftComment').value.trim() }); records[key].holiday = false; selectedDate = new Date(`${key}T12:00:00`); save(); closeShiftModal(); renderCalendar(); renderSelectedDay(); });
$('setHolidayBtn').addEventListener('click', () => { const key = shiftDate.value; if (!records[key]) records[key] = { shifts: [], holiday: false }; records[key].holiday = true; save(); selectedDate = new Date(`${key}T12:00:00`); closeShiftModal(); renderCalendar(); renderSelectedDay(); });

// Navigation: only bottom navigation controls panels.
document.querySelectorAll('.nav-btn').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b === button)); document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === button.dataset.tab)); if (button.dataset.tab === 'reports') renderReports(); }));
function renderReports() { const year = today.getFullYear(); let hours = 0; let income = 0; let count = 0; Object.values(records).forEach((r) => r.shifts.forEach((s) => { hours += Number(s.hours) || 0; income += Number(s.income) || 0; count++; })); $('totalHours').textContent = hours; $('totalEarnings').textContent = income.toLocaleString('ru-RU'); $('totalShifts').textContent = count; const body = $('reportTableBody'); body.innerHTML = ''; for (let m = 0; m < 12; m++) { let h=0, i=0, c=0; Object.entries(records).forEach(([key,r]) => { const d=new Date(`${key}T12:00:00`); if(d.getFullYear()===year&&d.getMonth()===m) r.shifts.forEach(s=>{h+=Number(s.hours)||0;i+=Number(s.income)||0;c++;}); }); if(c) body.insertAdjacentHTML('beforeend', `<tr><td>${new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(new Date(year,m,1))}</td><td>${h}</td><td>${c}</td><td>${i.toLocaleString('ru-RU')} ₽</td></tr>`); } if(!body.children.length) body.innerHTML='<tr><td colspan="4" style="text-align:center">Нет данных</td></tr>'; }

$('agreementBtn').addEventListener('click', () => agreementModal.classList.remove('hidden')); $('closeAgreement').addEventListener('click', () => agreementModal.classList.add('hidden')); $('agreeButton').addEventListener('click', () => agreementModal.classList.add('hidden')); agreementModal.addEventListener('click', (e) => { if(e.target===agreementModal) agreementModal.classList.add('hidden'); });
document.querySelectorAll('.theme-btn').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active')); button.classList.add('active'); document.documentElement.dataset.theme = button.dataset.theme; localStorage.setItem('shift-flow-theme', button.dataset.theme); }));
document.querySelectorAll('.lang-btn').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active')); button.classList.add('active'); }));

renderCalendar(); renderSelectedDay();