
const VAPID_PUBLIC_KEY = 'BKsTf1wxQNiM0tlZUpgzbxoPP-C3phHxs4wEKs7MgK-XJ1vp37vl3YWUNewnNjvTS7I-pHIrGUna2TVpWXmCwpM';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// ===== Referencias de jQuery =====
var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');
var modal       = $('#modal');
var rolBadge    = $('#modal-role-badge');
var txtMateria  = $('#txtMateria');
var selTipo     = $('#selTipo');
var txtMensaje  = $('#txtMensaje');
var notifBtn    = $('#notif-btn');
var notifBanner = $('#notif-banner');
var emptyState  = $('#empty-state');
var offlineInd  = $('#offline-indicator');
var themeToggle = $('#theme-toggle');

function aplicarTema(tema) {
    var esClaro = tema === 'light';
    document.body.dataset.theme = esClaro ? 'light' : 'dark';
    themeToggle.html(esClaro ? '<i class="fas fa-moon" aria-hidden="true"></i>' : '<i class="fas fa-sun" aria-hidden="true"></i>');
    themeToggle.attr('aria-label', esClaro ? 'Activar modo oscuro' : 'Activar modo claro');
    themeToggle.attr('title', esClaro ? 'Activar modo oscuro' : 'Activar modo claro');
    $('meta[name="theme-color"]').attr('content', esClaro ? '#5144c7' : '#4F46E5');
}

var temaGuardado = localStorage.getItem('avisos-tema') || 'dark';
aplicarTema(temaGuardado);

themeToggle.on('click', function () {
    var nuevoTema = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('avisos-tema', nuevoTema);
    aplicarTema(nuevoTema);
});

// El usuario seleccionado (maestro o alumno)
var usuario;

// Cola de mensajes pendientes (offline)
var colaPendiente = [];

// ===== Iconos por tipo =====
var iconosTipo = {
    tarea:    'fas fa-pencil-alt',
    examen:   'fas fa-clipboard-list',
    aviso:    'fas fa-bullhorn',
    material: 'fas fa-box-open'
};

var nombresTipo = {
    tarea:    'Tarea',
    examen:   'Examen',
    aviso:    'Aviso',
    material: 'Material'
};

function formatearFechaHora(fecha) {
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(fecha);
}

$('#fecha-ejemplo').text(formatearFechaHora(new Date()));

// ===== Crear HTML de un aviso =====
function crearAvisoHTML(materia, tipo, mensaje, autor) {

    var now = new Date();
    var fechaHora = formatearFechaHora(now);

    var iconClass = iconosTipo[tipo] || 'fas fa-info-circle';
    var tipoNombre = nombresTipo[tipo] || tipo;

    var iconoAutor = autor === 'maestro' 
        ? '<i class="fas fa-chalkboard-teacher"></i>' 
        : '<i class="fas fa-user-graduate"></i>';

    var content = `
    <li class="aviso-item tipo-${tipo} animated fadeIn fast">
        <div class="aviso-tipo-badge tipo-${tipo}">
            <i class="${iconClass}"></i>
        </div>
        <div class="aviso-content">
            <div class="aviso-header-info">
                <span class="aviso-materia">${materia}</span>
                <span class="aviso-tipo-tag tag-${tipo}">${tipoNombre}</span>
            </div>
            <div class="aviso-mensaje">
                ${mensaje}
            </div>
            <div class="aviso-footer">
                <span class="aviso-autor">${iconoAutor} ${autor.charAt(0).toUpperCase() + autor.slice(1)}</span>
                <span class="aviso-hora"><i class="far fa-clock"></i> ${fechaHora}</span>
            </div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}

// ===== Toast =====
function mostrarToast(msg, icono) {
    icono = icono || 'fas fa-check-circle';
    var toast = $('<div class="toast"><i class="' + icono + '"></i> ' + msg + '</div>');
    $('body').append(toast);
    setTimeout(function() { toast.addClass('show'); }, 10);
    setTimeout(function() {
        toast.removeClass('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

// ===== Log In / Log Out =====
function logIn(ingreso) {

    if (ingreso) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        actualizarEstadoNotificaciones();
        rolBadge.text(usuario.charAt(0).toUpperCase() + usuario.slice(1));
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');
        notifBanner.addClass('oculto');
        titulo.text('Avisos Escolares');
    }
}


// ===== Selección de rol =====
$('.seleccion-card').on('click', function () {
    usuario = $(this).data('user');

    var rolTexto = usuario === 'maestro' ? '👨‍🏫 Maestro' : '🎓 Alumno';
    titulo.text(rolTexto);

    logIn(true);
    mostrarToast('Sesión iniciada como ' + usuario);
});

// Botón de salir
salirBtn.on('click', function () {
    logIn(false);
    mostrarToast('Sesión cerrada', 'fas fa-sign-out-alt');
});

// Botón de nuevo aviso
nuevoBtn.on('click', function () {
    modal.removeClass('oculto');
    // Trigger reflow, then add show class for CSS transition
    modal[0].offsetHeight;
    modal.addClass('show');
});

// Botón de cancelar
cancelarBtn.on('click', function () {
    modal.removeClass('show');
    setTimeout(function () {
        modal.addClass('oculto');
        txtMateria.val('');
        txtMensaje.val('');
        selTipo.val('tarea');
    }, 400);
});

// Botón de enviar aviso
postBtn.on('click', function () {
    var materia = txtMateria.val().trim();
    var tipo = selTipo.val();
    var mensaje = txtMensaje.val().trim();

    if (mensaje.length === 0) {
        mostrarToast('Escribe un mensaje', 'fas fa-exclamation-triangle');
        return;
    }

    if (materia.length === 0) {
        mostrarToast('Selecciona una materia', 'fas fa-exclamation-triangle');
        return;
    }

    crearAvisoHTML(materia, tipo, mensaje, usuario);

    var payload = {
        title: nombresTipo[tipo] + ' — ' + materia,
        body: mensaje
    };

    if (navigator.onLine) {
        fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(async function(response) {
            if (!response.ok) throw new Error('El servidor rechazó el aviso');
            var resultado = await response.json();
            if (resultado.enviadas === 0) {
                mostrarToast('Aviso publicado, pero no hay dispositivos suscritos', 'fas fa-exclamation-triangle');
                return;
            }
            mostrarToast('Aviso enviado a ' + resultado.enviadas + ' dispositivo(s)');
        }).catch(function(error) {
            colaPendiente.push(payload);
            mostrarToast('Sin conexión con el servidor. El aviso se enviará al reconectar', 'fas fa-wifi');
        });
    } else {
        colaPendiente.push(payload);
        mostrarToast('Guardado offline', 'fas fa-wifi');
    }
});

// ===== Enviar cola pendiente cuando vuelva la conexión =====
window.addEventListener('online', function () {
    offlineInd.addClass('oculto');
    sincronizarSuscripcionPush();
    if (colaPendiente.length > 0) {
        mostrarToast('Conexión restaurada, enviando avisos...', 'fas fa-sync');
        var pendientes = colaPendiente.slice();
        Promise.all(pendientes.map(function(payload) {
            return fetch('/api/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function(response) {
                if (!response.ok) throw new Error('El servidor rechazó un aviso pendiente');
            });
        })).then(function() {
            colaPendiente.splice(0, pendientes.length);
        }).catch(function(error) {
            console.error('No se pudieron enviar los avisos pendientes:', error);
        });
    }
});

window.addEventListener('offline', function () {
    offlineInd.removeClass('oculto');
});

// ===== Suscripción a notificaciones push =====
async function actualizarEstadoNotificaciones() {
    if (!('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) {
        notifBanner.removeClass('oculto');
        notifBtn.prop('disabled', true).text('No disponible');
        return;
    }

    notifBanner.removeClass('oculto');
    if (Notification.permission === 'denied') {
        notifBtn.prop('disabled', true).text('Bloqueadas');
        return;
    }

    notifBtn.prop('disabled', false).html('<i class="fas fa-bell"></i> Activar');
    if (Notification.permission === 'granted') {
        try {
            var registro = await navigator.serviceWorker.ready;
            var sub = await registro.pushManager.getSubscription();
            if (sub) {
                notifBtn.html('<i class="fas fa-check"></i> Activadas');
                notifBanner.addClass('oculto');
                if (navigator.onLine) await registrarSuscripcion(sub);
            } else if (!navigator.onLine) {
                notifBtn.prop('disabled', true).text('Conéctate para completar');
            }
        } catch (error) {
            console.error('No se pudo sincronizar la suscripción push:', error);
        }
    }
}

async function registrarSuscripcion(sub) {
    var response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
    });
    if (!response.ok) throw new Error('El servidor no pudo guardar la suscripción');
}

async function sincronizarSuscripcionPush() {
    if (!('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        var registro = await navigator.serviceWorker.ready;
        var sub = await registro.pushManager.getSubscription();
        if (sub) await registrarSuscripcion(sub);
    } catch (error) {
        console.error('No se pudo sincronizar la suscripción push:', error);
    }
}

notifBtn.on('click', async function () {
    try {
        var permiso = Notification.permission;
        if (permiso !== 'granted') permiso = await Notification.requestPermission();
        if (permiso !== 'granted') {
            actualizarEstadoNotificaciones();
            mostrarToast('Permite las notificaciones en la configuración del navegador', 'fas fa-times-circle');
            return;
        }

        var registro = await navigator.serviceWorker.ready;
        var sub = await registro.pushManager.getSubscription();
        if (!sub) {
            sub = await registro.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        notifBtn.html('<i class="fas fa-check"></i> Activadas');
        notifBanner.addClass('oculto');
        if (navigator.onLine) {
            try {
                await registrarSuscripcion(sub);
                mostrarToast('Notificaciones activadas en este dispositivo', 'fas fa-bell');
            } catch (error) {
                console.error('No se pudo sincronizar la suscripción push:', error);
                mostrarToast('Permiso activado; se sincronizará al recuperar la conexión', 'fas fa-wifi');
            }
        } else {
            mostrarToast('Permiso activado; se sincronizará al recuperar la conexión', 'fas fa-wifi');
        }
    } catch (error) {
        console.error('Error al activar notificaciones:', error);
        if (Notification.permission === 'granted') {
            actualizarEstadoNotificaciones();
            mostrarToast(navigator.onLine ? 'No se pudo completar la suscripción' : 'Conéctate para completar la activación', 'fas fa-exclamation-triangle');
        } else {
            mostrarToast('No se pudieron activar las notificaciones', 'fas fa-exclamation-triangle');
        }
    }
});

// ===== Registro del Service Worker =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js')
            .then(function() {
                console.log('Service Worker registrado correctamente');
            })
            .catch(function (err) {
                console.log('Error al registrar el SW:', err);
            });
    });
}

if (!('Notification' in window) || !('PushManager' in window)) {
    console.log('Este navegador no soporta notificaciones push');
}
