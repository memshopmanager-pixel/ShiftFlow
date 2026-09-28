(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const storageKey = 'shift-flow-data';
  let records = JSON.parse(localStorage.getItem(storageKey) || '{}');
  let selectedColor = 'blue';

  // Visual overrides keep every new control compatible with all themes.
  const style = document.createElement('style');
  style.textContent = `.day-cell{overflow:hidden}.day-cell .day-work{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-weight:600;margin-top:4px;color:var(--text)}.day-cell.today .day-work{color:#fff}.day-actions{display:flex;gap:3px;position:absolute;right:3px;bottom:3px}.day-action{width:18px;height:18px;padding:0;border-radius:6px;border:0;background:var(--card-strong);color:var(--text);font-size:11px;line-height:1}.day-action.delete{color:#ff9b9b}.calendar-holiday{font-size:9px;color:var(--accent-3);font-weight:700;margin-top:4px}.month-year h2{display:flex;justify-content:center;gap:6px}.month-year .year{font-weight:500;color:var(--muted)}.report-scroll{overflow:auto;max-height:360px}.report-month{margin:0 0 12px;padding:14px;background:var(--card);border:1px solid var(--border);border-radius:16px}.report-month h4{margin:0 0 8px;color:var(--text)}.report-line{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:13px;padding:4px 0}.lang-name{font-size:12px;font-weight:600}.theme-btn{color:var(--text)}@media(max-width:640px){.day-work{font-size:8px!important}.day-actions{display:none}.day-cell:focus .day-actions,.day-cell:hover .day-actions{display:flex}}`;
  document.head.appendChild(style);

  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(records));
  const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const recordFor = (key) => records[key] || { shifts: [], holiday: false };
  const monthName = (date) => new Intl.DateTimeFormat('ru-RU', { month:'long' }).format(date).replace(/^./, (c) => c.toUpperCase());

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    $('monthLabel').innerHTML = `${monthName(currentMonth)} <span class="year">${year}</span>`;
    const first = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const grid = $('calendarDays');
    grid.innerHTML = '';
    for (let i = 0; i < first; i++) grid.insertAdjacentHTML('beforeend', '<div class="day-cell empty"></div>');
    for (let day = 1; day <= total; day++) {
      const date = new Date(year, month, day);
      const key = dateKey(date);
      const record = recordFor(key);
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.tabIndex = 0;
      if (date.toDateString() === today.toDateString()) cell.classList.add('today');
      if (date.toDateString() === selectedDate.toDateString()) cell.classList.add('selected');
      if (record.holiday) cell.classList.add('holiday-day');
      const names = [...new Set(record.shifts.map((s) => s.name).filter(Boolean))];
      const colors = [...new Set(record.shifts.map((s) => s.color).filter(Boolean))];
      cell.innerHTML = `<span class="day-number">${day}</span>${record.holiday ? '<span class="calendar-holiday">Выходной</span>' : ''}${names.slice(0,2).map((n) => `<span class="day-work">${escapeHtml(n)}</span>`).join('')}<span class="day-colors">${colors.map((c) => `<i class="mini-dot ${c}"></i>`).join('')}</span><span class="day-actions"><button class="day-action add" title="Добавить смену">＋</button>${record.shifts.length || record.holiday ? '<button class="day-action delete" title="Удалить записи">×</button>' : ''}</span>`;
      cell.addEventListener('click', (e) => { if (e.target.closest('.day-action')) return; selectedDate = date; renderCalendar(); openShiftModal(); });
      cell.querySelector('.add')?.addEventListener('click', (e) => { e.stopPropagation(); selectedDate = date; openShiftModal(); });
      cell.querySelector('.delete')?.addEventListener('click', (e) => { e.stopPropagation(); delete records[key]; save(); renderCalendar(); updateStats(); });
      grid.appendChild(cell);
    }
  }

  function openShiftModal() {
    $('shiftDate').value = dateKey(selectedDate);
    $('shiftForm').reset();
    $('shiftDate').value = dateKey(selectedDate);
    selectedColor = 'blue';
    document.querySelectorAll('.color-dot').forEach((b) => b.classList.toggle('active', b.dataset.color === selectedColor));
    $('shiftModal').classList.remove('hidden');
  }
  function closeShiftModal() { $('shiftModal').classList.add('hidden'); }

  function updateStats() {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    let hours=0, income=0, count=0;
    Object.entries(records).forEach(([key, r]) => { const d = new Date(`${key}T12:00:00`); if (d.getFullYear()===y && d.getMonth()===m) r.shifts.forEach((s) => { hours += Number(s.hours)||0; income += Number(s.income)||0; count++; }); });
    $('monthHours').textContent = hours; $('monthShifts').textContent = count; $('monthEarnings').textContent = `${income.toLocaleString('ru-RU')} ₽`;
  }

  function renderReports() {
    let hours=0, income=0, count=0;
    Object.values(records).forEach((r) => r.shifts.forEach((s) => { hours += Number(s.hours)||0; income += Number(s.income)||0; count++; }));
    $('totalHours').textContent = hours; $('totalEarnings').textContent = income.toLocaleString('ru-RU'); $('totalShifts').textContent = count;
    const table = $('reportTableBody');
    if (!table) return;
    table.innerHTML = '';
    const groups = {};
    Object.entries(records).forEach(([key, r]) => r.shifts.forEach((s) => { const d=new Date(`${key}T12:00:00`); const mk=`${d.getFullYear()}-${d.getMonth()}`; if(!groups[mk]) groups[mk]={date:d,h:0,i:0,c:0}; groups[mk].h+=Number(s.hours)||0; groups[mk].i+=Number(s.income)||0; groups[mk].c++; }));
    const sorted = Object.values(groups).sort((a,b)=>a.date-b.date);
    sorted.forEach((g) => table.insertAdjacentHTML('beforeend', `<tr><td>${monthName(g.date)} ${g.date.getFullYear()}</td><td>${g.h}</td><td>${g.c}</td><td>${g.i.toLocaleString('ru-RU')} ₽</td></tr>`));
    if (!sorted.length) table.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted)">Нет данных</td></tr>';
    const details = document.querySelector('.detailed-report');
    const heading = details?.querySelector('h3'); if (heading) heading.textContent = 'Отчёты по месяцам и годам';
    table.parentElement.classList.add('report-scroll');
  }

  $('prevMonth').addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1); renderCalendar(); updateStats(); });
  $('nextMonth').addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1); renderCalendar(); updateStats(); });
  $('addShiftButton').addEventListener('click', openShiftModal);
  $('closeModal').addEventListener('click', closeShiftModal);
  $('shiftModal').addEventListener('click', (e) => { if (e.target === $('shiftModal')) closeShiftModal(); });
  document.querySelectorAll('.color-dot').forEach((b) => b.addEventListener('click', () => { selectedColor=b.dataset.color; document.querySelectorAll('.color-dot').forEach((x)=>x.classList.toggle('active',x===b)); }));
  $('shiftForm').addEventListener('submit', (e) => { e.preventDefault(); const key=$('shiftDate').value; if(!records[key]) records[key]={shifts:[],holiday:false}; records[key].shifts.push({name:$('shiftName').value.trim(),hours:$('shiftHours').value,income:$('shiftIncome').value,color:selectedColor,comment:$('shiftComment').value.trim()}); records[key].holiday=false; selectedDate=new Date(`${key}T12:00:00`); save(); closeShiftModal(); renderCalendar(); updateStats(); });
  $('setHolidayBtn').addEventListener('click', () => { const key=$('shiftDate').value; if(!records[key]) records[key]={shifts:[],holiday:false}; records[key].holiday=true; save(); closeShiftModal(); renderCalendar(); updateStats(); });

  document.querySelectorAll('.nav-btn').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.nav-btn').forEach((b)=>b.classList.toggle('active',b===button)); document.querySelectorAll('.panel').forEach((p)=>p.classList.toggle('active',p.id===button.dataset.tab)); if(button.dataset.tab==='reports') renderReports(); }));
  document.querySelectorAll('.lang-btn').forEach((b) => { if(!b.querySelector('.lang-name')) b.insertAdjacentHTML('beforeend', `<span class="lang-name">${b.dataset.lang==='ru'?'Русский':'Английский'}</span>`); });
  document.querySelectorAll('.theme-btn').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.theme-btn').forEach((x)=>x.classList.toggle('active',x===b)); document.documentElement.dataset.theme=b.dataset.theme; localStorage.setItem('shift-flow-theme',b.dataset.theme); }));
  const savedTheme=localStorage.getItem('shift-flow-theme')||'system'; document.documentElement.dataset.theme=savedTheme; document.querySelectorAll('.theme-btn').forEach((b)=>b.classList.toggle('active',b.dataset.theme===savedTheme));
  $('agreementBtn').addEventListener('click', () => $('agreementModal').classList.remove('hidden')); $('closeAgreement').addEventListener('click', () => $('agreementModal').classList.add('hidden')); $('agreeButton').addEventListener('click', () => $('agreementModal').classList.add('hidden'));
  renderCalendar(); updateStats();
})();
