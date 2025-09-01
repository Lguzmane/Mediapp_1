document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales del dashboard
    cargarDashboard();
    
    // Configurar eventos del formulario de informes
    configurarFormularioInformes();
    
    // Cargar tablas de datos
    cargarTablaCitas();
    cargarTablaRegistros();
    
    // Configurar componentes dinámicos
    configurarComponentes();
});

// Función para cargar los datos del dashboard
function cargarDashboard() {
    // Simulación de datos - en una aplicación real harías peticiones AJAX
    setTimeout(() => {
        document.getElementById('citas-hoy').textContent = '12';
        document.getElementById('medicos-activos').textContent = '8';
        document.querySelectorAll('.card-value')[2].textContent = '45'; // Pacientes
        document.querySelectorAll('.card-value')[3].textContent = '5';  // Pendientes
    }, 800);
}

// Configuración del formulario de generación de informes
function configurarFormularioInformes() {
    const tipoInforme = document.getElementById('tipo-informe');
    const buscarRutBtn = document.getElementById('buscar-rut');
    const rutInput = document.getElementById('rut-busqueda');
    const resultadoBusqueda = document.getElementById('resultado-busqueda');
    const seleccionarRutBtn = document.getElementById('seleccionar-rut');
    const generarInformeBtn = document.getElementById('generar-informe');
    const fechaInicio = document.getElementById('fecha-inicio');
    const fechaFin = document.getElementById('fecha-fin');
    
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    fechaInicio.valueAsDate = hace30Dias;
    fechaFin.valueAsDate = hoy;
    
    // Cambiar placeholder según tipo de informe
    tipoInforme.addEventListener('change', function() {
        rutInput.placeholder = this.value === 'medico' 
            ? 'RUT médico (ej: 12345678-9)' 
            : 'RUT paciente (ej: 98765432-1)';
    });
    
    // Validar RUT al hacer clic en buscar
    buscarRutBtn.addEventListener('click', function() {
        if (!validarRUT(rutInput.value)) {
            alert('Por favor ingrese un RUT válido (ej: 12345678-9)');
            rutInput.focus();
            return;
        }
        
        // Simular búsqueda - en una app real sería una petición AJAX
        resultadoBusqueda.style.display = 'none';
        
        setTimeout(() => {
            const tipo = tipoInforme.value;
            const nombre = tipo === 'medico' 
                ? 'Dr. Carlos Mendoza' 
                : 'María González López';
            
            document.getElementById('rut-resultado').textContent = formatearRUT(rutInput.value);
            document.getElementById('nombre-resultado').textContent = nombre;
            resultadoBusqueda.classList.add('active');
            
            // Habilitar botón de generar si hay fechas válidas
            validarFormulario();
        }, 800);
    });
    
    // Seleccionar RUT encontrado
    seleccionarRutBtn.addEventListener('click', function() {
        rutInput.value = document.getElementById('rut-resultado').textContent;
        resultadoBusqueda.classList.remove('active');
        validarFormulario();
    });
    
    // Validar formulario al cambiar fechas
    fechaInicio.addEventListener('change', validarFormulario);
    fechaFin.addEventListener('change', validarFormulario);
    
    // Generar informe
    generarInformeBtn.addEventListener('click', function() {
        if (!this.disabled) {
            generarInforme();
        }
    });
    
    // Función para validar el formulario completo
    function validarFormulario() {
        const rutValido = validarRUT(rutInput.value);
        const fechasValidas = fechaInicio.value && fechaFin.value && 
                            new Date(fechaInicio.value) <= new Date(fechaFin.value);
        
        generarInformeBtn.disabled = !(rutValido && fechasValidas);
    }
    
    // Función para generar el informe
    function generarInforme() {
        const tipo = tipoInforme.value;
        const rut = rutInput.value;
        const desde = fechaInicio.value;
        const hasta = fechaFin.value;
        
        // Simular generación de informe
        generarInformeBtn.innerHTML = '<i class="bi bi-hourglass"></i> Generando...';
        generarInformeBtn.disabled = true;
        
        setTimeout(() => {
            alert(`Informe generado exitosamente\n\nTipo: ${tipo}\nRUT: ${rut}\nPeríodo: ${desde} a ${hasta}`);
            generarInformeBtn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Generar';
            generarInformeBtn.disabled = false;
        }, 2000);
    }
}

// Función para cargar la tabla de citas
function cargarTablaCitas() {
    const tabla = document.querySelector('#tabla-citas tbody');
    
    // Datos de ejemplo - en una app real vendrían de una API
    const citas = [
        { paciente: 'Juan Pérez', medico: 'Dra. Ana López', fecha: '15/04/2023 10:30', estado: 'Confirmada' },
        { paciente: 'María González', medico: 'Dr. Carlos Mendoza', fecha: '15/04/2023 11:00', estado: 'Confirmada' },
        { paciente: 'Pedro Sánchez', medico: 'Dra. Laura Fernández', fecha: '15/04/2023 14:15', estado: 'Pendiente' },
        { paciente: 'Ana Ramírez', medico: 'Dr. Roberto Jiménez', fecha: '16/04/2023 09:00', estado: 'Confirmada' }
    ];
    
    // Limpiar tabla
    tabla.innerHTML = '';
    
    // Llenar tabla con datos
    citas.forEach(cita => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${cita.paciente}</td>
            <td>${cita.medico}</td>
            <td>${cita.fecha}</td>
            <td><span class="badge ${getClaseEstado(cita.estado)}">${cita.estado}</span></td>
            <td class="text-end">
                <button class="btn-action ver"><i class="bi bi-eye"></i></button>
                <button class="btn-action editar"><i class="bi bi-pencil"></i></button>
            </td>
        `;
        
        tabla.appendChild(fila);
    });
}

// Función para cargar la tabla de últimos registros
function cargarTablaRegistros() {
    const tabla = document.querySelector('.data-table tbody');
    
    // Datos de ejemplo
    const registros = [
        { nombre: 'Dr. Carlos Mendoza', tipo: 'Médico', fecha: '10/04/2023', estado: 'Activo' },
        { nombre: 'María González', tipo: 'Paciente', fecha: '12/04/2023', estado: 'Activo' },
        { nombre: 'Pedro Sánchez', tipo: 'Paciente', fecha: '13/04/2023', estado: 'Pendiente' },
        { nombre: 'Dra. Ana López', tipo: 'Médico', fecha: '14/04/2023', estado: 'Activo' }
    ];
    
    // Limpiar tabla
    tabla.innerHTML = '';
    
    // Llenar tabla con datos
    registros.forEach(reg => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${reg.nombre}</td>
            <td>${reg.tipo}</td>
            <td>${reg.fecha}</td>
            <td><span class="badge ${getClaseEstado(reg.estado)}">${reg.estado}</span></td>
        `;
        
        tabla.appendChild(fila);
    });
}

// Función para configurar componentes dinámicos
function configurarComponentes() {
    // Configurar tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        new bootstrap.Tooltip(el);
    });
    
    // Configurar eventos de botones de acción
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-action.ver')) {
            const fila = e.target.closest('tr');
            const paciente = fila.cells[0].textContent;
            alert(`Ver detalles de: ${paciente}`);
        }
        
        if (e.target.closest('.btn-action.editar')) {
            const fila = e.target.closest('tr');
            const paciente = fila.cells[0].textContent;
            alert(`Editar: ${paciente}`);
        }
    });
}

// ---------- FUNCIONES UTILITARIAS ----------

// Validar formato de RUT chileno
function validarRUT(rut) {
    if (!rut) return false;
    
    // Eliminar puntos y guión
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Validar formato básico
    if (!/^[0-9]+[0-9kK]{1}$/.test(rutLimpio)) return false;
    
    // Validar dígito verificador
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dvCalculado === dv;
}

// Formatear RUT con puntos y guión
function formatearRUT(rut) {
    if (!rut) return '';
    
    // Eliminar caracteres no numéricos
    const rutLimpio = rut.replace(/[^0-9kK]/g, '');
    
    if (rutLimpio.length < 2) return rut;
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    // Agregar puntos cada 3 dígitos
    let cuerpoFormateado = '';
    for (let i = cuerpo.length - 1, j = 1; i >= 0; i--, j++) {
        cuerpoFormateado = cuerpo.charAt(i) + cuerpoFormateado;
        if (j % 3 === 0 && i !== 0) cuerpoFormateado = '.' + cuerpoFormateado;
    }
    
    return `${cuerpoFormateado}-${dv}`;
}

// Obtener clase CSS según estado
function getClaseEstado(estado) {
    const estados = {
        'Confirmada': 'badge-success',
        'Activo': 'badge-success',
        'Pendiente': 'badge-warning',
        'Cancelada': 'badge-danger'
    };
    
    return estados[estado] || 'badge-secondary';
}