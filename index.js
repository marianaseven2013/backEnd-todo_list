// Requiriendo las dependencias necesarias
var express = require('express');
var cors = require('cors');
var path = require('path');
var mysql = require('mysql2'); //<----------mysql2

var app = express();

app.use(cors({
  origin: 'http://127.0.0.1:5500', // Aquí puedes ajustar esto al origen de tu frontend
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

// Rutas del servidor
app.get('/', (req, res) => {
  res.send('¡Hola desde mi backend en Express!');
});

// Rutas adicionales
app.get('/hola', (req, res) => {
  res.send('¡Hola mundo Génesis!');
});

//---------------------------------------------------------------------------
//CONSULTAS A MI BASE DE DATOS SQL EN MYSQL SERVER
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: 's1234!Strong', //Contraseña
  database: 'todo_list' 
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos: ', err);
    return;
  }
  console.log('Conexión a la base de datos establecida');
});

app.get('/usuarios', (req, res) => {
  // Realiza una consulta SELECT a la base de datos
  db.query('SELECT * FROM tareas', (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta: ', err);
      res.status(500).send('Error en la consulta');
      return;
    }
    // Enviar los resultados de la consulta como respuesta en formato JSON
    res.json(results);
  });
});

// Ruta para registrar un nuevo usuario
const { body, validationResult } = require('express-validator');

app.post('/registro', [
  body('usuario').trim().isLength({ min: 3 }).escape(),
  body('contraseña').isLength({ min: 5 }),
  body('correo').isEmail().normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const { usuario, contraseña, correo } = req.body;

  const query = 'INSERT INTO usuario (usuario, contraseña, correo) VALUES (?, ?, ?)';
  db.query(query, [usuario, contraseña, correo], (err, results) => {
      if (err) {
          console.error('Error al registrar usuario: ', err);
          return res.status(500).json({ mensaje: 'Error al registrar usuario' });
      }
      res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  });
});

app.get('/tareas', (req, res) => {
  const usuario_id = req.query.usuario_id; // Obtener el usuario_id de la query

  if (!usuario_id) {
      return res.status(400).json({ mensaje: 'usuario_id es requerido' });
  }

  const query = 'SELECT * FROM tareas WHERE usuario_id = ?';
  db.query(query, [usuario_id], (err, results) => {
      if (err) {
          console.error('Error al consultar tareas: ', err);
          return res.status(500).json({ mensaje: 'Error al consultar tareas' });
      }
      res.json(results);
  });
});

const jwt = require('jsonwebtoken');

app.post('/login', (req, res) => {
  const { correo, contraseña } = req.body; // Extraer correo y contraseña del cuerpo de la solicitud

  if (!correo || !contraseña) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son requeridos' });
  }

  const query = 'SELECT * FROM usuario WHERE correo = ? AND contraseña = ?';
  db.query(query, [correo, contraseña], (err, results) => {
      if (err) {
          console.error('Error al realizar el login: ', err);
          return res.status(500).json({ mensaje: 'Error al realizar el login' });
      }

      if (results.length > 0) {
          res.status(200).json({ mensaje: 'Login exitoso', usuario: results[0] });
      } else {
          res.status(401).json({ mensaje: 'Credenciales incorrectas' });
      }
  });
});

app.post('/tareas', (req, res) => {
  console.log("Cuerpo de la solicitud:", req.body); 
  const { nombre_tarea, usuario_id } = req.body;

  if (!nombre_tarea || !usuario_id) {
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  const estado = 'pendiente';

  const query = 'INSERT INTO tareas (nombre_tarea, estado, usuario_id) VALUES (?, ?, ?)';
  db.query(query, [nombre_tarea, estado, usuario_id], (err, results) => {
      if (err) {
          console.error('Error al agregar tarea: ', err);
          return res.status(500).json({ mensaje: 'Error al agregar tarea' });
      }
      res.status(201).json({ mensaje: 'Tarea agregada con éxito', id: results.insertId });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

module.exports = app;