const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'database.sqlite');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para ver todas las peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('Body recibido:', req.body);
  }
  next();
});

// Conectar a la base de datos SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar la base de datos:', err.message);
  } else {
    console.log('Base de datos conectada correctamente.');
  }
});

// Crear tabla de usuarios
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      fecha TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla usuarios:', err.message);
    } else {
      console.log('Tabla usuarios lista.');
    }
  });
});

// Ruta para la página de registro
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para la página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// API para guardar registro
app.post('/api/registro', (req, res) => {
  console.log('=== REGISTRO RECIBIDO ===');
  const { email, password, nombre, fecha } = req.body;

  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Nombre:', nombre);
  console.log('Fecha:', fecha);

  if (!email || !password || !nombre || !fecha) {
    console.log('ERROR: Campos faltantes');
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios.'
    });
  }

  db.run(
    `INSERT INTO usuarios (email, password, nombre, fecha) VALUES (?, ?, ?, ?)`,
    [email, password, nombre, fecha],
    function (err) {
      if (err) {
        console.error('ERROR en INSERT:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            message: 'Este correo ya está registrado.'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error al guardar el usuario.'
        });
      }

      console.log('✓ Usuario guardado correctamente');
      return res.status(201).json({
        success: true,
        message: 'Registro exitoso.'
      });
    }
  );
});

// API para login
app.post('/api/login', (req, res) => {
  console.log('=== LOGIN RECIBIDO ===');
  const { email, password } = req.body;

  console.log('Email:', email);
  console.log('Password:', password);

  if (!email || !password) {
    console.log('ERROR: Email o password faltante');
    return res.status(400).json({
      success: false,
      message: 'Correo y contraseña obligatorios.'
    });
  }

  db.get(
    'SELECT * FROM usuarios WHERE email = ? AND password = ?',
    [email, password],
    (err, row) => {
      if (err) {
        console.error('ERROR en SELECT:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Error al verificar usuario.'
        });
      }

      if (!row) {
        console.log('❌ Usuario no encontrado');
        return res.status(401).json({
          success: false,
          message: 'Correo o contraseña incorrectos.'
        });
      }

      console.log('✓ Usuario autenticado:', row.nombre);
      return res.status(200).json({
        success: true,
        message: 'Operación realizada con éxito.'
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
