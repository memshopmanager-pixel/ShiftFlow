(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const storageKey = 'shift-flow-data';
  let records = JSON.parse(localStorage.getItem(storageKey) || '{}');

  const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthName = (date) => new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date).replace(/^./, (char) => char.toUpperCase());
  const save = () => localStorage.setItem(storageKey, JSON.stringify(records));

  function getShiftHours(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  }

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    $('monthLabel').textContent = `${monthName(currentMonth)} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = $('calendarDays');
    grid.innerHTML = '';

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell empty';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = dateKey(date);
      const record = records[key] || { shifts: [] };
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'day-cell';
      if (date.toDateString() === today.toDateString()) cell.classList.add('today');
      if (date.toDateString() === selectedDate.toDateString()) cell.classList.add('selected');

      cell.innerHTML = `<span class="day-number">${day}</span>`;

      if (record.shifts && record.shifts.length > 0) {
        cell.insertAdjacentHTML('beforeend', `<span class="shift-badge">${record.shifts.length}</span>`);
      }

      cell.addEventListener('click', () => {
        selectedDate = new Date(year, month, day);
        openShiftModal(dateKey(selectedDate));
      });

      grid.appendChild(cell);
    }
  }

  function updateStats() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let hours = 0;
    let income = 0;
    let count = 0;

    Object.entries(records).forEach(([key, record]) => {
      const date = new Date(`${key}T12:00:00`);
      if (date.getFullYear() === year && date.getMonth() === month) {
        (record.shifts || []).forEach((shift) => {
          const shiftHours = getShiftHours(shift.start, shift.end);
          hours += shiftHours;
          income += shiftHours * (Number(shift.rate) || 500);
          count += 1;
        });
      }
    });

    $('monthHours').textContent = Math.round(hours);
    $('monthShifts').textContent = count;
    $('monthEarnings').textContent = `${Math.round(income).toLocaleString('ru-RU')} ₽`;
  }

  function renderReports() {
    let totalHours = 0;
    let totalIncome = 0;
    let totalCount = 0;
    const groups = {};

    Object.entries(records).forEach(([key, record]) => {
      (record.shifts || []).forEach((shift) => {
        const date = new Date(`${key}T12:00:00`);
        const groupKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!groups[groupKey]) {
          groups[groupKey] = {
            date,
            hours: 0,
            count: 0,
            income: 0,
          };
        }

        const shiftHours = getShiftHours(shift.start, shift.end);
        groups[groupKey].hours += shiftHours;
        groups[groupKey].count += 1;
        groups[groupKey].income += shiftHours * (Number(shift.rate) || 500);

        totalHours += shiftHours;
        totalIncome += shiftHours * (Number(shift.rate) || 500);
        totalCount += 1;
      });
    });

    $('totalHours').textContent = Math.round(totalHours);
    $('totalEarnings').textContent = Math.round(totalIncome).toLocaleString('ru-RU');
    $('totalShifts').textContent = totalCount;

    const table = $('reportTableBody');
    if (!table) return;
    table.innerHTML = '';

    const sortedGroups = Object.values(groups).sort((a, b) => a.date - b.date);

    if (!sortedGroups.length) {
      table.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--muted);">Нет данных</td></tr>';
      return;
    }

    sortedGroups.forEach((group) => {
      table.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${monthName(group.date)} ${group.date.getFullYear()}</td>
          <td>${Math.round(group.hours)}</td>
          <td>${group.count}</td>
          <td>${Math.round(group.income).toLocaleString('ru-RU')} ₽</td>
        </tr>
      `);
    });
  }

  function openShiftModal(dateValue = dateKey(selectedDate)) {
    $('shiftDate').value = dateValue;
    $('shiftForm').reset();
    $('shiftDate').value = dateValue;
    $('shiftRate').value = '500';
    $('addShiftModal').classList.remove('hidden');
    $('addShiftModal').setAttribute('aria-hidden', 'false');
  }

  function closeShiftModal() {
    $('addShiftModal').classList.add('hidden');
    $('addShiftModal').setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
      const panelId = button.getAttribute('data-panel');
      document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
      $('#' + panelId)?.classList.add('active');
      button.classList.add('active');

      if (panelId === 'reports') renderReports();
    });
  });

  $('addShiftBtn').addEventListener('click', () => openShiftModal(dateKey(selectedDate)));
  $('closeModalBtn').addEventListener('click', closeShiftModal);
  $('cancelBtn').addEventListener('click', closeShiftModal);
  $('addShiftModal').addEventListener('click', (event) => {
    if (event.target === $('addShiftModal')) closeShiftModal();
  });

  $('shiftForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const date = $('shiftDate').value;
    const start = $('shiftStart').value;
    const end = $('shiftEnd').value;
    const rate = $('shiftRate').value || '500';
    const description = $('shiftDescription').value.trim();

    if (!date || !start || !end) return;

    const record = records[date] || { shifts: [] };
    record.shifts.push({ start, end, rate, description });
    records[date] = record;

    save();
    renderCalendar();
    updateStats();
    renderReports();
    closeShiftModal();
  });

  $('prevMonth').addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
    updateStats();
  });

  $('nextMonth').addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
    updateStats();
  });

  document.querySelectorAll('.lang-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
    });
  });

  document.querySelectorAll('.theme-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('shift-flow-theme', theme);
      document.querySelectorAll('.theme-btn').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
    });
  });

  const savedTheme = localStorage.getItem('shift-flow-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.querySelectorAll('.theme-btn').forEach((button) => {
    if (button.getAttribute('data-theme') === savedTheme) button.classList.add('active');
  });

  renderCalendar();
  updateStats();
  renderReports();
})();

