const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const calendarDays = document.getElementById('calendarDays');
const monthLabel = document.getElementById('monthLabel');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const shiftModal = document.getElementById('shiftModal');
const closeModalBtn = document.getElementById('closeModal');
const addShiftButton = document.getElementById('addShiftButton');
const shiftForm = document.getElementById('shiftForm');
const shiftDate = document.getElementById('shiftDate');

const today = new Date();
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  monthLabel.textContent = `${new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(currentMonth)} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    const prevDay = daysInPrevMonth - startDay + i + 1;
    emptyCell.innerHTML = `<span class="day-number" style="opacity:0.25;">${prevDay}</span>`;
    fragment.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';

    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();

    if (isToday) cell.classList.add('today');
    if (isSelected) cell.classList.add('selected');

    cell.innerHTML = `<span class="day-number">${day}</span>`;

    if (isToday || day % 6 === 0) {
      const dot = document.createElement('span');
      dot.className = 'shift-dot';
      cell.appendChild(dot);
    }

    cell.addEventListener('click', () => {
      selectedDate = date;
      shiftDate.value = date.toISOString().split('T')[0];
      renderCalendar();
    });

    fragment.appendChild(cell);
  }

  calendarDays.innerHTML = '';
  calendarDays.appendChild(fragment);
}

function goToNextMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderCalendar();
}

function goToPrevMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderCalendar();
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    panels.forEach((panel) => panel.classList.toggle('active', panel.id === tab.dataset.tab));
  });
});

prevMonthBtn.addEventListener('click', goToPrevMonth);
nextMonthBtn.addEventListener('click', goToNextMonth);

function openModal() {
  shiftModal.classList.remove('hidden');
  shiftModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  shiftModal.classList.add('hidden');
  shiftModal.setAttribute('aria-hidden', 'true');
}

addShiftButton.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
shiftModal.addEventListener('click', (event) => {
  if (event.target === shiftModal) closeModal();
});

shiftForm.addEventListener('submit', (event) => {
  event.preventDefault();
  closeModal();
  const item = document.createElement('div');
  item.className = 'shift-item';
  item.innerHTML = `
    <div class="shift-time">08:00 — 16:00</div>
    <div class="shift-meta">Новая смена • ${shiftDate.value}</div>
  `;
  document.getElementById('shiftItems').prepend(item);
});

renderCalendar();
shiftDate.value = selectedDate.toISOString().split('T')[0];

const themeButtons = document.querySelectorAll('.theme-button');
const flagButtons = document.querySelectorAll('.flag-button');

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    themeButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
  });
});

flagButtons.forEach((button) => {
  button.addEventListener('click', () => {
    flagButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
  });
});
