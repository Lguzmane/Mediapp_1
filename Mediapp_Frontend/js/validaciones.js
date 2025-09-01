// ==================== CONFIGURACIÓN DE RUTAS ==================== //
const APP_ROUTES = {
    paciente: {
        reservas: 'paciente/reservas.html',
        citas: 'paciente/citas.html',
        perfil: 'paciente/perfil.html',
        index: '../index.html'
    },
    medico: {
        agenda: 'medico/agenda.html',
        perfil: 'medico/perfil.html'
    },
    admin: {
        dashboard: 'admin/dashboard.html'
    },
    general: {
        login: 'login.html',
        registro: 'registro.html',
        recuperar: 'recuperar.html',
        index: 'index.html'
    }
};

// ==================== USUARIOS DE PRUEBA ==================== //
const inicializarUsuariosDemo = () => {
    const usuariosDemo = [
        {
            rut: '12.345.678-9',
            nombre: 'Lorena Guzmán',
            email: 'lorena@gmail.com',
            password: 'Aa123456',
            tipoUsuario: 'paciente',
            telefono: '+56987654321',
            direccion: 'Av. Principal 123, Santiago',
            fechaNacimiento: '1985-04-15',
            genero: 'femenino'
        },
        {
            rut: '11.223.334-5',
            nombre: 'Dona Guzmán',
            email: 'dona@gmail.com',
            password: 'Aa123456',
            tipoUsuario: 'medico',
            especialidad: 'Cardiología',
            telefono: '+56912345678',
            añosExperiencia: 8
        },
        {
            rut: '10.987.654-3',
            nombre: 'Vlado Guzmán',
            email: 'vlado@gmail.com',
            password: 'Aa123456',
            tipoUsuario: 'admin',
            telefono: '+56955555555',
            rol: 'Administrador Principal'
        }
    ];

    if (!localStorage.getItem('usuarios')) {
        localStorage.setItem('usuarios', JSON.stringify(usuariosDemo));
    }
};

// ==================== FUNCIONES GLOBALES ==================== //
const actualizarEstadoSesion = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Actualizar UI con nombre de usuario
    if (isLoggedIn && currentUser.nombre) {
        const elementosUsuario = document.querySelectorAll('.nombre-usuario');
        elementosUsuario.forEach(el => {
            el.textContent = currentUser.nombre.split(' ')[0]; // Mostrar solo primer nombre
        });
    }

    // Protección de rutas
    if (!isLoggedIn && !['/', '/index.html', '/login.html', '/registro.html', '/recuperar.html']
        .some(ruta => window.location.pathname.endsWith(ruta))) {
        window.location.href = APP_ROUTES.general.login;
    }

    // Mostrar/ocultar elementos según rol
    if (isLoggedIn) {
        document.querySelectorAll('[data-role]').forEach(elemento => {
            elemento.style.display = elemento.dataset.role === currentUser.tipoUsuario ? 'block' : 'none';
        });
    }
};

// ==================== VALIDACIÓN DE FORMULARIOS ==================== //
const validarRUT = (rut) => {
    if (!rut) return false;
    
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
    const cuerpo = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    
    if (!/^\d+$/.test(cuerpo)) return false;
    
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dv === dvCalculado;
};

const validarPassword = (password) => {
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneNumero = /\d/.test(password);
    const longitudMinima = password.length >= 8;
    return tieneMayuscula && tieneNumero && longitudMinima;
};

// ==================== MANEJADORES DE EVENTOS ==================== //
const configurarLogin = () => {
    const formularioLogin = document.getElementById('loginForm');
    if (!formularioLogin) return;

    formularioLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = formularioLogin.email.value;
        const password = formularioLogin.password.value;

        if (!email || !password) {
            alert('Por favor complete todos los campos');
            return;
        }

        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email && u.password === password);

        if (usuario) {
            localStorage.setItem('currentUser', JSON.stringify(usuario));
            localStorage.setItem('isLoggedIn', 'true');
            
            // Redirección según rol
            const rutaDestino = APP_ROUTES[usuario.tipoUsuario]?.reservas || 
                                APP_ROUTES[usuario.tipoUsuario]?.agenda || 
                                APP_ROUTES[usuario.tipoUsuario]?.dashboard || 
                                APP_ROUTES.general.index;
            
            window.location.href = rutaDestino;
        } else {
            alert('Credenciales incorrectas. Prueba con:\n\nlorena@gmail.com / Aa123456\ndona@gmail.com / Aa123456\nvlado@gmail.com / Aa123456');
        }
    });
};

const configurarRegistro = () => {
    const formularioRegistro = document.getElementById('registroForm');
    if (!formularioRegistro) return;

    // Selector de tipo de usuario
    document.querySelectorAll('.user-type-btn').forEach(boton => {
        boton.addEventListener('click', function() {
            document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            formularioRegistro.tipoUsuario.value = this.dataset.type;
            
            // Mostrar campos específicos
            document.getElementById('camposMedico').classList.toggle('d-none', this.dataset.type !== 'medico');
            document.getElementById('camposAdmin').classList.toggle('d-none', this.dataset.type !== 'admin');
        });
    });

    formularioRegistro.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!validarRUT(formularioRegistro.rut.value)) {
            alert('RUT inválido. Ejemplo: 12.345.678-9');
            return;
        }

        if (!validarPassword(formularioRegistro.password.value)) {
            alert('La contraseña debe tener:\n- 8+ caracteres\n- 1 mayúscula\n- 1 número');
            return;
        }

        if (formularioRegistro.password.value !== formularioRegistro.confirmPassword.value) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (formularioRegistro.tipoUsuario.value === 'admin' && 
            formularioRegistro.codigoAdmin.value !== 'ADMIN123') {
            alert('Código de administrador incorrecto');
            return;
        }

        // Crear nuevo usuario
        const nuevoUsuario = {
            rut: formularioRegistro.rut.value,
            nombre: formularioRegistro.nombre.value,
            email: formularioRegistro.email.value,
            password: formularioRegistro.password.value,
            tipoUsuario: formularioRegistro.tipoUsuario.value,
            telefono: formularioRegistro.telefono?.value || '',
            direccion: formularioRegistro.direccion?.value || '',
            fechaRegistro: new Date().toISOString()
        };

        // Campos específicos
        if (nuevoUsuario.tipoUsuario === 'medico') {
            nuevoUsuario.especialidad = formularioRegistro.especialidad.value;
        }

        // Guardar usuario
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        if (usuarios.some(u => u.email === nuevoUsuario.email)) {
            alert('Este email ya está registrado');
            return;
        }

        usuarios.push(nuevoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        // Autologin
        localStorage.setItem('currentUser', JSON.stringify(nuevoUsuario));
        localStorage.setItem('isLoggedIn', 'true');
        alert('¡Registro exitoso!');
        
        // Redirección
        const rutaDestino = APP_ROUTES[nuevoUsuario.tipoUsuario]?.reservas || 
                            APP_ROUTES[nuevoUsuario.tipoUsuario]?.agenda || 
                            APP_ROUTES[nuevoUsuario.tipoUsuario]?.dashboard || 
                            APP_ROUTES.general.index;
        
        window.location.href = rutaDestino;
    });
};

const configurarLogout = () => {
    document.querySelectorAll('[data-action="logout"]').forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            window.location.href = APP_ROUTES.general.login;
        });
    });
};

// ==================== INICIALIZACIÓN ==================== //
document.addEventListener('DOMContentLoaded', () => {
    inicializarUsuariosDemo();
    configurarLogin();
    configurarRegistro();
    configurarLogout();
    configurarRecuperacion(); 
    actualizarEstadoSesion();
});

// ==================== RECUPERACIÓN DE CONTRASEÑA ==================== //
const configurarRecuperacion = () => {
    const formularioRecuperar = document.getElementById('recuperarForm');
    if (!formularioRecuperar) return;

    // Elemento para mostrar mensajes
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'alert mt-3';
    mensajeDiv.style.display = 'none';
    formularioRecuperar.parentNode.insertBefore(mensajeDiv, formularioRecuperar.nextSibling);

    formularioRecuperar.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = formularioRecuperar.email.value;
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const usuarioExiste = usuarios.some(u => u.email === email);

        // Validar formato de email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mensajeDiv.textContent = 'Por favor ingresa un email válido';
            mensajeDiv.className = 'alert alert-danger mt-3';
            mensajeDiv.style.display = 'block';
            return;
        }

        // Mostrar mensaje según si el email existe
        if (usuarioExiste) {
            mensajeDiv.textContent = '¡Éxito! Hemos enviado un enlace de recuperación a tu email.';
            mensajeDiv.className = 'alert alert-success mt-3';
            mensajeDiv.style.display = 'block';
            
            // Simular envío (en un sistema real aquí iría una llamada al backend)
            setTimeout(() => {
                window.location.href = APP_ROUTES.general.login;
            }, 3000);
        } else {
            mensajeDiv.textContent = 'No existe una cuenta asociada a este email.';
            mensajeDiv.className = 'alert alert-danger mt-3';
            mensajeDiv.style.display = 'block';
        }
    });

    // Validación en tiempo real del email
    formularioRecuperar.email.addEventListener('input', () => {
        if (mensajeDiv.style.display === 'block') {
            mensajeDiv.style.display = 'none';
        }
    });
};