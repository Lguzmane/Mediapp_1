document.addEventListener('DOMContentLoaded', function() {
    // ===== Datos compartidos de médicos =====
    const medicosPorEspecialidad = {
        cardiologia: [
            { 
                id: 1, 
                nombre: "Dr. Francisco Melo",  
                especialidad: "Cardiólogo",
                diasNoDisponibles: ["2025-12-25", "2026-01-01"], 
                horario: { inicio: 8, fin: 18 }
            },
            { 
                id: 2, 
                nombre: "Dra. Cinthia Gallardo", 
                especialidad: "Cardióloga",
                diasNoDisponibles: ["2025-12-31"], 
                horario: { inicio: 9, fin: 17 } 
            }
        ],
        pediatria: [
            { 
                id: 3, 
                nombre: "Dr. Felipe Avello", 
                especialidad: "Pediatra",
                diasNoDisponibles: [], 
                horario: { inicio: 8, fin: 15 } 
            }
        ],
        medicina_general: [
            { 
                id: 4, 
                nombre: "Dra. Eloísa Aguilera", 
                especialidad: "Médico General",
                diasNoDisponibles: ["2025-12-24", "2025-12-31"], 
                horario: { inicio: 10, fin: 19 } 
            }
        ]
    };

    let medicoSeleccionado = null;
    let fechaSeleccionada = null;
    let horaSeleccionada = null;

    // ===== Funciones auxiliares =====
    function obtenerCitas() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const key = `citas_${currentUser.email || currentUser.rut}`;
    return JSON.parse(localStorage.getItem(key)) || [];
}

    function guardarCitas(citas) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const key = `citas_${currentUser.email || currentUser.rut}`;
    localStorage.setItem(key, JSON.stringify(citas));
}
    // ===== RESERVAS =====
    if (document.getElementById('selectEspecialidad') && window.location.pathname.includes('paciente/reservas.html')) {
        // Manejar reagendación si existe
        const citaAReagendar = JSON.parse(localStorage.getItem('citaAReagendar'));
        if (citaAReagendar) {
            document.getElementById('selectEspecialidad').value = citaAReagendar.especialidad;
            document.getElementById('selectEspecialidad').dispatchEvent(new Event('change'));
            
            setTimeout(() => {
                const medicoCard = document.querySelector(`.medico-card[data-medico-id="${citaAReagendar.medicoId}"]`);
                if (medicoCard) {
                    medicoCard.querySelector('.btn-seleccionar-medico').click();
                    localStorage.removeItem('citaAReagendar');
                }
            }, 500);
        }

        // Selección de especialidad
        document.getElementById('selectEspecialidad').addEventListener('change', function() {
            const especialidad = this.value;
            const seccionMedicos = document.getElementById('seccionMedicos');
            const listaMedicos = document.getElementById('listaMedicos');
            
            document.getElementById('seccionFechaHora').classList.add('d-none');
            medicoSeleccionado = null;
            
            if (!especialidad) {
                seccionMedicos.classList.add('d-none');
                return;
            }
            
            listaMedicos.innerHTML = '';
            
            medicosPorEspecialidad[especialidad].forEach(medico => {
                const medicoHTML = `
                    <div class="col-md-6">
                        <div class="card medico-card" data-medico-id="${medico.id}">
                            <div class="card-body text-center">
                                <img src="${medico.imagen}" alt="${medico.nombre}" class="img-thumbnail rounded-circle mb-2" width="80">
                                <h6 class="card-title">${medico.nombre}</h6>
                                <p class="card-text text-muted small">${medico.especialidad}</p>
                                <button class="btn btn-sm btn-outline-primary btn-seleccionar-medico">Seleccionar</button>
                            </div>
                        </div>
                    </div>
                `;
                listaMedicos.insertAdjacentHTML('beforeend', medicoHTML);
            });
            
            seccionMedicos.classList.remove('d-none');
        });

        // Selección de médico
        document.getElementById('listaMedicos').addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-seleccionar-medico')) {
                const card = e.target.closest('.medico-card');
                medicoSeleccionado = parseInt(card.getAttribute('data-medico-id'));
                document.getElementById('seccionFechaHora').classList.remove('d-none');
                initCalendario();
            }
        });

        // Calendario y horas
        function initCalendario() {
            const especialidad = document.getElementById('selectEspecialidad').value;
            const medico = medicosPorEspecialidad[especialidad].find(m => m.id == medicoSeleccionado);
            
            flatpickr("#inputFecha", {
                locale: "es",
                minDate: "today",
                maxDate: new Date().fp_incr(30),
                disable: [
                    medico.diasNoDisponibles,
                    function(date) {
                        return (date.getDay() === 0 || date.getDay() === 6);
                    }
                ],
                onChange: function(selectedDates) {
                    fechaSeleccionada = selectedDates[0];
                    cargarHorasDisponibles(medico);
                }
            });
        }

        function cargarHorasDisponibles(medico) {
            const contenedorHoras = document.getElementById('horasContainer');
            contenedorHoras.innerHTML = '<div class="d-flex flex-wrap"></div>';
            const contenedor = contenedorHoras.firstChild;
            
            for (let hora = medico.horario.inicio; hora <= medico.horario.fin; hora++) {
                for (let minuto of ['00', '30']) {
                    if (Math.random() > 0.3) { // Simular disponibilidad aleatoria
                        const horaBtn = document.createElement('button');
                        horaBtn.className = 'hora-btn btn btn-outline-primary btn-sm me-2 mb-2';
                        horaBtn.textContent = `${hora}:${minuto}`;
                        horaBtn.addEventListener('click', function() {
                            document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('active'));
                            this.classList.add('active');
                            horaSeleccionada = this.textContent;
                        });
                        contenedor.appendChild(horaBtn);
                    }
                }
            }

            if (contenedor.children.length === 0) {
                contenedorHoras.innerHTML = `
                    <div class="alert alert-secondary">
                        No hay horas disponibles este día. Elija otra fecha.
                    </div>
                `;
            }
        }

        // Confirmar reserva
        document.getElementById('btnConfirmar').addEventListener('click', function() {
            const especialidad = document.getElementById('selectEspecialidad').value;
            const fecha = document.getElementById('inputFecha').value;
            const hora = document.querySelector('.hora-btn.active')?.textContent;
            
            if (!fecha || !hora) {
                Swal.fire({
                    title: 'Datos incompletos',
                    text: 'Por favor seleccione fecha y hora',
                    icon: 'warning'
                });
                return;
            }
            
            const citas = obtenerCitas();
            const medico = medicosPorEspecialidad[especialidad].find(m => m.id == medicoSeleccionado);
            
            const nuevaCita = {
                id: Date.now(),
                medicoId: medicoSeleccionado,
                medicoNombre: medico.nombre,
                especialidad: especialidad,
                especialidadNombre: medico.especialidad,
                fecha: fecha,
                hora: hora,
                estado: 'agendada',
                fechaCreacion: new Date().toISOString()
            };
            
            citas.push(nuevaCita);
            guardarCitas(citas);
            
            Swal.fire({
                title: 'Reserva confirmada',
                html: `Su cita con <b>${medico.nombre}</b> (${medico.especialidad}) es el <b>${new Date(fecha).toLocaleDateString('es')}</b> a las <b>${hora}</b>`,
                icon: 'success',
                confirmButtonText: 'Ver mis citas'
            }).then(() => {
                window.location.href = 'citas.html';
            });
        });
    }

    // ===== CITAS =====
    if (document.getElementById('citas-container') && window.location.pathname.includes('paciente/citas.html')) {
        // Cargar citas al iniciar
        cargarCitas();
        
        // Manejar cancelación
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-cancelar')) {
                const citaId = parseInt(e.target.closest('.card-cita').getAttribute('data-cita-id'));
                const citas = obtenerCitas();
                const cita = citas.find(c => c.id === citaId);
                
                if (cita) {
                    Swal.fire({
                        title: 'Confirmar cancelación',
                        html: `¿Cancelar cita con <b>${cita.medicoNombre}</b> el <b>${new Date(cita.fecha).toLocaleDateString('es')}</b> a las <b>${cita.hora}</b>?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, cancelar',
                        cancelButtonText: 'Volver'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            cita.estado = 'cancelada';
                            guardarCitas(citas);
                            cargarCitas();
                            Swal.fire('Cancelada', 'La cita ha sido cancelada', 'success');
                        }
                    });
                }
            }
            
            // Manejar reagendación
            if (e.target.classList.contains('btn-reagendar')) {
                const citaId = parseInt(e.target.closest('.card-cita').getAttribute('data-cita-id'));
                const citas = obtenerCitas();
                const cita = citas.find(c => c.id === citaId);
                
                if (cita) {
                    localStorage.setItem('citaAReagendar', JSON.stringify(cita));
                    window.location.href = 'reservas.html';
                }
            }
        });
    }

    // Función para cargar citas en citas.html
   function cargarCitas() {
    let citas = obtenerCitas().filter(c => c.medicoNombre && c.especialidadNombre); // Evita mostrar datos mal guardados
    const citasContainer = document.getElementById('citas-container');
    const historialContainer = document.getElementById('historial-container');

    citasContainer.innerHTML = '<h6 class="text-muted">Tus nuevas citas</h6>';
    historialContainer.innerHTML = '<h6 class="text-muted">Historial</h6>';

    const citasAgendadas = citas.filter(c => c.estado === 'agendada');
    const citasCompletadas = citas.filter(c => c.estado === 'completada');

    // ======================
    // Ejemplo agendado: Dra. Ana Silva
    // ======================
    citasContainer.innerHTML += `
        <div class="card card-cita mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title mb-1">Dra. Felipe Avello</h6>
                        <p class="card-text text-muted small mb-2">Médico General</p>
                    </div>
                    <span class="badge bg-primary">Agendada</span>
                </div>
                <div class="separador my-2"></div>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="d-block"><i class="bi bi-calendar-date"></i> 20/07/2025</span>
                        <span class="d-block"><i class="bi bi-clock"></i> 11:00</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary disabled me-2">
                            <i class="bi bi-calendar2-week"></i> Reagendar
                        </button>
                        <button class="btn btn-sm btn-outline-danger disabled">
                            <i class="bi bi-x-circle"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // ======================
    // Ejemplo completado: Dr. Juan Pérez
    // ======================
    historialContainer.innerHTML += `
        <div class="card card-cita mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title mb-1">Dr. Alonso Aguilera</h6>
                        <p class="card-text text-muted small mb-2">Médico General</p>
                    </div>
                    <span class="badge bg-success">Completada</span>
                </div>
                <div class="separador my-2"></div>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="d-block"><i class="bi bi-calendar-date"></i> 10/07/2025</span>
                        <span class="d-block"><i class="bi bi-clock"></i> 10:30</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // ======================
    // Citas reales agendadas
    // ======================
    citasAgendadas.forEach(cita => {
        const citaHTML = `
            <div class="card card-cita mb-3" data-cita-id="${cita.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title mb-1">${cita.medicoNombre}</h6>
                            <p class="card-text text-muted small mb-2">${cita.especialidadNombre}</p>
                        </div>
                        <span class="badge bg-primary">Agendada</span>
                    </div>
                    <div class="separador my-2"></div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="d-block"><i class="bi bi-calendar-date"></i> ${new Date(cita.fecha).toLocaleDateString('es')}</span>
                            <span class="d-block"><i class="bi bi-clock"></i> ${cita.hora}</span>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-secondary btn-reagendar me-2" data-cita-id="${cita.id}">
                                <i class="bi bi-calendar2-week"></i> Reagendar
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-cancelar" data-cita-id="${cita.id}">
                                <i class="bi bi-x-circle"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        citasContainer.insertAdjacentHTML('beforeend', citaHTML);
    });

    // ======================
    // Citas reales completadas
    // ======================
    citasCompletadas.forEach(cita => {
        const citaHTML = `
            <div class="card card-cita mb-3" data-cita-id="${cita.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title mb-1">${cita.medicoNombre}</h6>
                            <p class="card-text text-muted small mb-2">${cita.especialidadNombre}</p>
                        </div>
                        <span class="badge bg-success">Completada</span>
                    </div>
                    <div class="separador my-2"></div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="d-block"><i class="bi bi-calendar-date"></i> ${new Date(cita.fecha).toLocaleDateString('es')}</span>
                            <span class="d-block"><i class="bi bi-clock"></i> ${cita.hora}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        historialContainer.insertAdjacentHTML('beforeend', citaHTML);
    });
}})
