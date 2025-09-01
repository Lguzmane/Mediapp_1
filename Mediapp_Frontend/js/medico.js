document.addEventListener('DOMContentLoaded', function () {
    let currentDate = new Date();
    let appointments = [];
    let blockedSlots = [];
    let selectedSlots = [];

    const currentWeekElement = document.getElementById('current-week');
    const prevWeekButton = document.getElementById('prev-week');
    const nextWeekButton = document.getElementById('next-week');
    const timeSlotsContainer = document.getElementById('time-slots');
    const blockTimeButton = document.getElementById('block-time');
    const refreshButton = document.getElementById('refresh');
    const blockModal = document.getElementById('block-modal');
    const appointmentModal = document.getElementById('appointment-modal');
    const blockForm = document.getElementById('block-form');
    const appointmentDetails = document.getElementById('appointment-details');
    const viewPatientButton = document.getElementById('view-patient');
    const cancelAppointmentButton = document.getElementById('cancel-appointment');

    refreshButton.textContent = 'Liberar Horario';

    refreshCalendar();

    prevWeekButton.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        refreshCalendar();
        clearSelection();
    });

    nextWeekButton.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        refreshCalendar();
        clearSelection();
    });

    blockTimeButton.addEventListener('click', () => {
        if (selectedSlots.length > 0) {
            reserveSelectedSlots();
        } else {
            openBlockModal();
        }
    });

    refreshButton.addEventListener('click', () => {
        if (selectedSlots.length > 0) {
            freeSelectedSlots();
        } else {
            refreshCalendar();
        }
    });

    viewPatientButton.addEventListener('click', viewPatientProfile);
    cancelAppointmentButton.addEventListener('click', cancelAppointment);

    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function (event) {
        if (event.target === blockModal) blockModal.style.display = 'none';
        if (event.target === appointmentModal) appointmentModal.style.display = 'none';
    });

    function refreshCalendar() {
        updateWeekDisplay();
        updateCalendarHeader(); // << NUEVO
        generateTimeSlots();
        loadAppointments();
        loadBlockedSlots();
    }

    function updateWeekDisplay() {
        const start = getStartOfWeek(currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        currentWeekElement.textContent = `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
    }

    function updateCalendarHeader() {
        const headerRow = document.querySelector('.calendar-header');
        headerRow.innerHTML = '<div class="time-column">Hora</div>';

        const startOfWeek = getStartOfWeek(currentDate);
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        for (let i = 0; i < 6; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(dayDate.getDate() + i);
            const dayNum = dayDate.getDate();
            const month = dayDate.toLocaleString('es-ES', { month: 'short' });

            const div = document.createElement('div');
            div.className = 'day-column';
            div.textContent = `${dayNames[i]} ${dayNum} ${month}`;
            headerRow.appendChild(div);
        }
    }

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function generateTimeSlots() {
        timeSlotsContainer.innerHTML = '';
        const startOfWeek = getStartOfWeek(currentDate);

        for (let hour = 8; hour < 20; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                const row = document.createElement('div');
                row.className = 'time-slot';

                const timeLabel = document.createElement('div');
                timeLabel.className = 'time-label';
                timeLabel.textContent = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                row.appendChild(timeLabel);

                for (let i = 0; i < 6; i++) {
                    const cell = document.createElement('div');
                    cell.className = 'day-cell';
                    cell.dataset.day = i;
                    cell.dataset.time = `${hour}:${minutes}`;

                    const slotDate = new Date(startOfWeek);
                    slotDate.setDate(slotDate.getDate() + i);
                    slotDate.setHours(hour, minutes, 0, 0);

                    cell.addEventListener('click', () => handleTimeSlotClick(cell, slotDate));
                    row.appendChild(cell);
                }

                timeSlotsContainer.appendChild(row);
            }
        }
    }

    function handleTimeSlotClick(cell, date) {
        const appointment = appointments.find(app => new Date(app.date).getTime() === date.getTime());
        const isBlocked = blockedSlots.some(b => date >= new Date(b.start) && date < new Date(b.end));

        if (appointment) {
            showAppointmentDetails(appointment);
        } else {
            toggleSlotSelection(cell, date);
        }
    }

    function toggleSlotSelection(cell, date) {
        const existing = selectedSlots.find(s => s.cell === cell);
        if (existing) {
            selectedSlots = selectedSlots.filter(s => s.cell !== cell);
            cell.classList.remove('selected');
        } else {
            selectedSlots.push({ cell, date });
            cell.classList.add('selected');
        }
        updateButtonStates();
    }

    function updateButtonStates() {
        const hasSelection = selectedSlots.length > 0;
        const blockedCount = selectedSlots.filter(s => s.cell.classList.contains('blocked')).length;

        blockTimeButton.textContent = hasSelection ? `Reservar (${selectedSlots.length})` : 'Reservar Horario';
        blockTimeButton.classList.toggle('btn-highlight', hasSelection);

        refreshButton.textContent = blockedCount > 0 ? `Liberar (${blockedCount})` : 'Liberar Horario';
        refreshButton.classList.toggle('btn-warning-highlight', blockedCount > 0);
    }

    function reserveSelectedSlots() {
        if (!confirm(`¿Reservar ${selectedSlots.length} horario(s)?`)) return;

        const nuevos = selectedSlots.map(s => ({
            id: Date.now() + Math.random(),
            start: new Date(s.date),
            end: new Date(s.date.getTime() + 30 * 60000),
            reason: 'Reserva rápida'
        }));

        blockedSlots = blockedSlots.concat(nuevos);
        renderBlockedSlots();
        clearSelection();
        showFeedbackMessage('Horarios reservados correctamente', 'success');
    }

    function freeSelectedSlots() {
        const slotsToFree = selectedSlots.filter(s => s.cell.classList.contains('blocked'));

        if (slotsToFree.length === 0) {
            showFeedbackMessage('Selecciona horarios reservados para liberar', 'error');
            return;
        }

        if (!confirm(`¿Liberar ${slotsToFree.length} horario(s)?`)) return;

        slotsToFree.forEach(slot => {
            blockedSlots = blockedSlots.filter(b => {
                const bs = new Date(b.start);
                const be = new Date(b.end);
                return !(slot.date >= bs && slot.date < be);
            });
        });

        renderBlockedSlots();
        clearSelection();
        showFeedbackMessage('Horarios liberados correctamente', 'success');
    }

    function clearSelection() {
        selectedSlots.forEach(s => s.cell.classList.remove('selected'));
        selectedSlots = [];
        updateButtonStates();
    }

    function loadAppointments() {
        const start = getStartOfWeek(currentDate);
        const d1 = new Date(start); d1.setHours(10, 0);
        const d2 = new Date(start); d2.setDate(d2.getDate() + 2); d2.setHours(15, 30);

        appointments = [
            {
                id: 1,
                patientId: 101,
                patientName: "Pepa Pig",
                date: d1,
                reason: "Consulta general",
                status: "Confirmada",
                notes: "Paciente con alergias a la penicilina"
            },
            {
                id: 2,
                patientId: 102,
                patientName: "Karl Marx",
                date: d2,
                reason: "Control postoperatorio",
                status: "Confirmada"
            }
        ];

        renderAppointments();
    }

    function loadBlockedSlots() {
        renderBlockedSlots();
    }

    function renderAppointments() {
        document.querySelectorAll('.day-cell.appointment').forEach(c => {
            c.classList.remove('appointment');
            c.innerHTML = '';
        });

        const startOfWeek = getStartOfWeek(currentDate);

        appointments.forEach(app => {
            const date = new Date(app.date);
            if (date < startOfWeek || date >= new Date(startOfWeek.getTime() + 7 * 86400000)) return;

            const jsDay = date.getDay();
            const day = jsDay === 0 ? null : jsDay - 1;
            if (day === null || day >= 6) return;

            const hour = date.getHours();
            const minutes = date.getMinutes();
            const cells = document.querySelectorAll(`.day-cell[data-day="${day}"][data-time="${hour}:${minutes}"]`);

            cells.forEach(cell => {
                cell.classList.add('appointment');
                cell.innerHTML = `
                    <div class="appointment-badge">
                        <span>${app.patientName.split(' ')[0]}</span>
                        <small>${app.reason.substring(0, 15)}${app.reason.length > 15 ? '...' : ''}</small>
                    </div>`;
            });
        });
    }

    function renderBlockedSlots() {
        document.querySelectorAll('.day-cell.blocked').forEach(c => {
            c.classList.remove('blocked');
            if (!c.classList.contains('appointment')) c.innerHTML = '';
        });

        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        blockedSlots.forEach(block => {
            let current = new Date(block.start);
            while (current < new Date(block.end)) {
                const jsDay = current.getDay();
                const day = jsDay === 0 ? null : jsDay - 1;
                if (day !== null && day < 6) {
                    const hour = current.getHours();
                    const minutes = current.getMinutes();
                    const cells = document.querySelectorAll(`.day-cell[data-day="${day}"][data-time="${hour}:${minutes}"]`);

                    cells.forEach(cell => {
                        if (!cell.classList.contains('appointment')) {
                            cell.classList.add('blocked');
                            cell.innerHTML = '<div class="blocked-badge">Reservado</div>';
                        }
                    });
                }
                current.setMinutes(current.getMinutes() + 30);
            }
        });
    }

    function showAppointmentDetails(app) {
        appointmentDetails.innerHTML = `
            <p><strong>Paciente:</strong> ${app.patientName}</p>
            <p><strong>Fecha:</strong> ${new Date(app.date).toLocaleString('es-ES')}</p>
            <p><strong>Motivo:</strong> ${app.reason}</p>
            <p><strong>Estado:</strong> ${app.status}</p>
            ${app.notes ? `<p><strong>Notas:</strong> ${app.notes}</p>` : ''}`;
        viewPatientButton.dataset.appointmentId = app.id;
        cancelAppointmentButton.dataset.appointmentId = app.id;
        appointmentModal.style.display = 'block';
    }

    function openBlockModal() {
        blockForm.reset();
        blockModal.style.display = 'block';
    }

    function showFeedbackMessage(message, type) {
        const toast = document.createElement('div');
        toast.className = `feedback-message feedback-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeInOut 3s ease-in-out';
            setTimeout(() => document.body.removeChild(toast), 3000);
        }, 0);
    }

    function viewPatientProfile() {
        const appointmentId = this.dataset.appointmentId;
        const app = appointments.find(a => a.id == appointmentId);
        if (app) alert(`Redirigiendo al perfil del paciente: ${app.patientName}`);
    }

    function cancelAppointment() {
        const appointmentId = this.dataset.appointmentId;
        if (confirm('¿Está seguro que desea cancelar esta cita?')) {
            appointments = appointments.filter(a => a.id != appointmentId);
            renderAppointments();
            appointmentModal.style.display = 'none';
            alert('Cita cancelada exitosamente');
        }
    }

    blockForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const date = document.getElementById('block-date').value;
        const start = document.getElementById('block-start').value;
        const end = document.getElementById('block-end').value;
        const reason = document.getElementById('block-reason').value;

        const dStart = new Date(`${date}T${start}`);
        const dEnd = new Date(`${date}T${end}`);

        if (dEnd <= dStart) {
            alert('La hora de fin debe ser posterior a la hora de inicio');
            return;
        }

        blockedSlots.push({
            id: Date.now(),
            start: dStart,
            end: dEnd,
            reason: reason || 'Bloqueo manual'
        });

        renderBlockedSlots();
        blockModal.style.display = 'none';
        alert('Horario bloqueado exitosamente');
    });
});
