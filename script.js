const today = new Date();
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

// Initialize calendar
const calendarDays = document.getElementById('calendarDays');
const monthLabel = document.getElementById('monthLabel');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

function capitalizeMonth(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(currentMonth);
  monthLabel.textContent = capitalizeMonth(monthName);

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
      openModal();
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

prevMonthBtn.addEventListener('click', goToPrevMonth);
nextMonthBtn.addEventListener('click', goToNextMonth);

// Bottom navigation tabs
const navBtns = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');

navBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    
    navBtns.forEach((b) => b.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    
    btn.classList.add('active');
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  });
});

// Shift modal
const shiftModal = document.getElementById('shiftModal');
const closeModalBtn = document.getElementById('closeModal');
const shiftForm = document.getElementById('shiftForm');
const shiftDate = document.getElementById('shiftDate');

function openModal() {
  shiftModal.classList.remove('hidden');
  shiftModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  shiftModal.classList.add('hidden');
  shiftModal.setAttribute('aria-hidden', 'true');
}

closeModalBtn.addEventListener('click', closeModal);
shiftModal.addEventListener('click', (event) => {
  if (event.target === shiftModal) closeModal();
});

shiftForm.addEventListener('submit', (event) => {
  event.preventDefault();
  closeModal();
});

// Agreement modal
const agreementBtn = document.getElementById('agreementBtn');
const agreementModal = document.getElementById('agreementModal');
const closeAgreementBtn = document.getElementById('closeAgreement');
const agreeButton = document.getElementById('agreeButton');

agreementBtn.addEventListener('click', () => {
  agreementModal.classList.remove('hidden');
  agreementModal.setAttribute('aria-hidden', 'false');
});

closeAgreementBtn.addEventListener('click', () => {
  agreementModal.classList.add('hidden');
  agreementModal.setAttribute('aria-hidden', 'true');
});

agreeButton.addEventListener('click', () => {
  agreementModal.classList.add('hidden');
  agreementModal.setAttribute('aria-hidden', 'true');
});

agreementModal.addEventListener('click', (event) => {
  if (event.target === agreementModal) {
    agreementModal.classList.add('hidden');
    agreementModal.setAttribute('aria-hidden', 'true');
  }
});

// Theme buttons
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    themeButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

// Language buttons
const langButtons = document.querySelectorAll('.lang-btn');
langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    langButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

// Filter buttons
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

// Initialize
renderCalendar();
shiftDate.value = selectedDate.toISOString().split('T')[0];
