const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.VAPID_PUBLIC || !process.env.VAPID_PRIVATE) {
    throw new Error('Configura VAPID_PUBLIC y VAPID_PRIVATE en el archivo .env');
}

webpush.setVapidDetails(
    'mailto:cristian.flores@utcv.edu.mx',
    process.env.VAPID_PUBLIC,
    process.env.VAPID_PRIVATE
);

let suscripciones = []; // Puede ser una BD en el futuro

// Endpoint para suscribirse a notificaciones push
app.post('/api/subscribe', (req, res) => {
    const sub = req.body;
    if (!sub || !sub.endpoint || !sub.keys) {
        return res.status(400).json({ ok: false, error: 'Suscripción inválida' });
    }
    const yaExiste = suscripciones.some((s) => s.endpoint === sub.endpoint);
    if (!yaExiste) suscripciones.push(sub);
    console.log('📋 Suscripciones activas:', suscripciones.length);
    res.status(201).json({ ok: true });
});

// Endpoint para enviar notificación push a todos los suscritos
app.post('/api/push', async (req, res) => {
    if (!req.body || !req.body.title || !req.body.body) {
        return res.status(400).json({ ok: false, error: 'El aviso requiere title y body' });
    }

    const payload = JSON.stringify({
        title: req.body.title,
        body: req.body.body
    });

    console.log('📢 Enviando notificación:', req.body.title);

    let enviadas = 0;
    let fallidas = 0;
    for (const sub of suscripciones) {
        try {
            await webpush.sendNotification(sub, payload);
            enviadas += 1;
        } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
                suscripciones = suscripciones.filter((s) => s.endpoint !== sub.endpoint);
                console.log('🗑️  Suscripción eliminada (expirada)');
            } else {
                fallidas += 1;
                console.error('Error al enviar notificación push:', err.message);
            }
        }
    }
    res.json({ enviadas, fallidas, suscriptores: suscripciones.length });
});

// Servir la aplicación estática
app.use('/avisos-escolares', express.static(path.join(__dirname, '../../avisos-escolares')));
app.use(express.static(path.join(__dirname, '../../avisos-escolares')));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('');
    console.log('  🏫 Avisos Escolares — Servidor Activo');
    console.log('  ────────────────────────────────────────');
    console.log(`  🌐 Servidor escuchando en el puerto ${port}`);
    console.log('');
});
