document.addEventListener('DOMContentLoaded', function() {
    const headerPath = '../components/header.html';
    const footerPath = '../components/footer.html';

    const loadComponent = async (path, containerId) => {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Error al cargar ${path}`);
            const html = await response.text();

            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = html;

                if (containerId === 'header-container') {
                    renderUserMenu(); // Cargar menú de sesión
                }
            }
        } catch (error) {
            console.error(`Error loading ${containerId}:`, error);
            if (containerId === 'header-container') {
                document.getElementById(containerId).innerHTML = `
                    <nav class="navbar navbar-dark bg-primary">
                        <div class="container">
                            <a class="navbar-brand" href="../index.html">MediApp</a>
                        </div>
                    </nav>`;
            }
        }
    };

    const renderUserMenu = () => {
        const navSession = document.getElementById('nav-session');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

        navSession.innerHTML = '';

        if (isLoggedIn && currentUser.nombre) {
            navSession.innerHTML = `
                <li class="nav-item me-2">
                    <span class="nav-link disabled">Hola, ${currentUser.nombre.split(' ')[0]}</span>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link text-warning" id="logoutBtn">
                        <i class="bi bi-box-arrow-right me-1"></i>Salir
                    </a>
                </li>
            `;

            document.getElementById('logoutBtn').addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isLoggedIn');
                window.location.href = '../login.html';
            });

        } else {
            navSession.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="../login.html">Ingresar</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="../registro.html">Registrarse</a>
                </li>
            `;
        }
    };

    loadComponent(headerPath, 'header-container');
    loadComponent(footerPath, 'footer-container');
});
