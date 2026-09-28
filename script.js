(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const storageKey = 'shift-flow-data';
  let records = JSON.parse(localStorage.getItem(storageKey) || '{}');

  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(records));
  const monthName = (date) => new Intl.DateTimeFormat('ru-RU', { month:'long' }).format(date).replace(/^./, (c) => c.toUpperCase());

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    $('monthLabel').textContent = `${monthName(currentMonth)} ${year}`;
    
    const first = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const grid = $('calendarDays');
    grid.innerHTML = '';
    
    for (let i = 0; i < first; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell empty';
      grid.appendChild(empty);
    }
    
    for (let day = 1; day <= total; day++) {
      const date = new Date(year, month, day);
      const key = dateKey(date);
      const record = records[key] || { shifts: [] };
      
      const cell = document.createElement('button');
      cell.className = 'day-cell';
      cell.type = 'button';
      
      if (date.toDateString() === today.toDateString()) cell.classList.add('today');
      if (date.toDateString() === selectedDate.toDateString()) cell.classList.add('selected');
      
      cell.innerHTML = `<span class="day-number">${day}</span>`;
      if (record.shifts.length > 0) {
        cell.innerHTML += `<span class="shift-indicator">${record.shifts.length}</span>`;
      }
      
      cell.addEventListener('click', () => {
        selectedDate = new Date(year, month, day);
        $('shiftDate').value = dateKey(selectedDate);
        $('addShiftModal').classList.remove('hidden');
      });
      
      grid.appendChild(cell);
    }
  }

  function updateStats() {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    let hours = 0, income = 0, count = 0;
    
    Object.entries(records).forEach(([key, r]) => {
      const d = new Date(`${key}T12:00:00`);
      if (d.getFullYear() === y && d.getMonth() === m) {
        r.shifts.forEach((s) => {
          const [start, end] = [s.start, s.end];
          if (start && end) {
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const h = eh + em/60 - sh - sm/60;
            hours += h;
            income += h * (Number(s.rate) || 500);
          }
          count++;
        });
      }
    });
    
    $('monthHours').textContent = Math.round(hours);
    $('monthShifts').textContent = count;
    $('monthEarnings').textContent = `${Math.round(income).toLocaleString('ru-RU')} ₽`;
  }

  function renderReports() {
    let hours = 0, income = 0, count = 0;
    Object.values(records).forEach((r) => {
      r.shifts.forEach((s) => {
        if (s.start && s.end) {
          const [sh, sm] = s.start.split(':').map(Number);
          const [eh, em] = s.end.split(':').map(Number);
          const h = eh + em/60 - sh - sm/60;
          hours += h;
          income += h * (Number(s.rate) || 500);
        }
        count++;
      });
    });
    
    $('totalHours').textContent = Math.round(hours);
    $('totalEarnings').textContent = Math.round(income).toLocaleString('ru-RU');
    $('totalShifts').textContent = count;
    
    const table = $('reportTableBody');
    if (!table) return;
    table.innerHTML = '';
    
    const groups = {};
    Object.entries(records).forEach(([key, r]) => {
      r.shifts.forEach((s) => {
        const d = new Date(`${key}T12:00:00`);
        const mk = `${d.getFullYear()}-${d.getMonth()}`;
        if (!groups[mk]) groups[mk] = { date: d, hours: 0, count: 0, income: 0 };
        
        if (s.start && s.end) {
          const [sh, sm] = s.start.split(':').map(Number);
          const [eh, em] = s.end.split(':').map(Number);
          const h = eh + em/60 - sh - sm/60;
          groups[mk].hours += h;
          groups[mk].income += h * (Number(s.rate) || 500);
        }
        groups[mk].count++;
      });
    });
    
    Object.values(groups).sort((a,b) => a.date - b.date).forEach((g) => {
      table.insertAdjacentHTML('beforeend', 
        `<tr><td>${monthName(g.date)} ${g.date.getFullYear()}</td><td>${Math.round(g.hours)}</td><td>${g.count}</td><td>${Math.round(g.income).toLocaleString('ru-RU')} ₽</td></tr>`
      );
    });
    
    if (!Object.keys(groups).length) {
      table.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted)">Нет данных</td></tr>';
    }
  }

  // Navigation
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-panel');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      
      $(panelId)?.classList.add('active');
      btn.classList.add('active');
      
      if (panelId === 'reports') renderReports();
    });
  });

  // Add Shift Modal
  $('addShiftBtn')?.addEventListener('click', () => {
    $('shiftDate').value = dateKey(selectedDate);
    $('shiftForm').reset();
    $('addShiftModal').classList.remove('hidden');
  });

  $('closeModalBtn')?.addEventListener('click', () => {
    $('addShiftModal').classList.add('hidden');
  });

  $('cancelBtn')?.addEventListener('click', () => {
    $('addShiftModal').classList.add('hidden');
  });

  $('addShiftModal')?.addEventListener('click', (e) => {
    if (e.target === $('addShiftModal')) {
      $('addShiftModal').classList.add('hidden');
    }
  });

  $('shiftForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = $('shiftDate').value;
    const start = $('shiftStart').value;
    const end = $('shiftEnd').value;
    const rate = $('shiftRate').value || '500';
    const description = $('shiftDescription').value;

    if (!records[date]) records[date] = { shifts: [] };
    records[date].shifts.push({ start, end, rate, description });
    
    save();
    renderCalendar();
    updateStats();
    $('addShiftModal').classList.add('hidden');
  });

  // Calendar Navigation
  $('prevMonth')?.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
    updateStats();
  });

  $('nextMonth')?.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
    updateStats();
  });

  // Theme
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('shift-flow-theme', theme);
      
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const savedTheme = localStorage.getItem('shift-flow-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    if (btn.getAttribute('data-theme') === savedTheme) btn.classList.add('active');
  });

  // Language
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Language switching can be implemented here
    });
  });

  // Initialize
  renderCalendar();
  updateStats();
})();
