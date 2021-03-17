const express = require("express");
const mysql = require("mysql");
const util = require("util");
const cors = require('cors')
// también utilizamos el module "NODEMON" para el desarrollo
const app = express();
const port = 3000;

app.use(express.json()); 
app.use(bodyToUpper) // Middleware para pasar campos a mayúscula
app.use(validacionEspacios) // Middleware para chequear que no haya espacios en blanco
app.use(cors())

const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "libros2" // se adjunta base de datos en carpeta sql como archivo db.sql
});

conexion.connect((error) => {
    if (error) { throw error; }
    console.log("Conexión con la base de datos establecida");
});

const qy = util.promisify(conexion.query).bind(conexion); 

// Middleware para pasar campos a mayúscula y borrar espacios innecesarios

function bodyToUpper(req, res, next) {
    const { body } = req
    for (const campo in body) {
        if (typeof body[campo] === 'string') {
            body[campo] = body[campo].toUpperCase().trim()
        }
    }
    next()
}

// Middleware para chequear que no haya espacios en blanco usando método trim (previamente verifica que el campo sea de tipo string para no generar error)
function validacionEspacios(req, res, next) {
    const { body } = req
    try {
        for (const campo in body) {
            if (typeof body[campo] === 'string') {
                if (!body[campo].trim()) {
                    throw new Error('Debe ingresar todos los campos solicitados')
                }
            }
        }
        next()
    } catch (error) {
        res.status(400).send(error.message)
    }
}

// empieza la app

// GET de categorias

app.get("/api/categoria", async (req, res) => {
    try {
        let query = "SELECT * FROM categoria";
        let respuesta = await qy(query, []);
        res.status(200).send(respuesta);
    }
    catch (e) {
        res.status(500).send("Error inesperado")
    }
});

app.get("/api/categoria/:id", async (req, res) => {
    try {
        let query = "SELECT * FROM categoria where id = ?";
        let respuesta = await qy(query, [req.params.id]);
        if (respuesta.length > 0) {
            res.json(respuesta[0]);
        } else {
            throw { codigo: 404, mensaje: "La categoría ingresada no existe" };
        }
    }
    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
});

app.delete("/api/categoria/:id", async (req, res) => {
    try {
        // verifico que exista categoria
        let query = "SELECT * FROM categoria WHERE id = ?";
        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: "No se encuentra la categoría ingresada" };
        }
        //verifico que la categoría no tenga libros asociados
        query = "SELECT * FROM libros WHERE id_categoria = ?";
        respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0) {
            throw { codigo: 400, mensaje: "Categoría con libros asociados, no se puede eliminar" };
        }
        //borro la categoria
        query = "DELETE FROM categoria WHERE id = ?";
        respuesta = await qy(query, [req.params.id]);
        res.status(200).send("Categoría borrada correctamente");
    }

    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }

    }
})

app.post("/api/categoria", async (req, res) => {
    try {
        if (!req.body.nombre) {
            throw { codigo: 400, mensaje: 'Debe ingresar todos los campos solicitados' };
        }
        const nombre = req.body.nombre;
        let query = "SELECT nombre from categoria where nombre = ? ";
        let respuesta = await qy(query, [nombre]);
        if (respuesta.length > 0) {
            throw { codigo: 400, mensaje: "El nombre de categoría ingresado ya existe" };
        }
        query = "INSERT into categoria (nombre) VALUE (?)";
        respuesta = await qy(query, [nombre]);
        let idAgregado = respuesta.insertId;
        query = "SELECT * from categoria WHERE id = ?";
        respuesta = await qy(query, [idAgregado]);
        res.status(200).send(respuesta);
    }
    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }

    }
});


// PERSONA 

app.get("/api/persona", async (req, res) => {
    try {
        let query = 'SELECT * from persona';
        let respuesta = await qy(query, []);
        res.status(200).send(respuesta);
    } catch (e) {
        res.status(500).send("Error inesperado");
    }
});

app.get("/api/persona/:id", async (req, res) => {
    try {
        let query = "SELECT * FROM persona where id = ?";
        let respuesta = await qy(query, [req.params.id]);
        if (respuesta.length > 0) {
            res.json(respuesta[0]);
        } else {
            res.status(404).send("La persona ingresada no existe");
        }
    }
    catch (e) {
        console.error(e.message);
        res.status(500).send("Error inesperado");
    }
});

app.post("/api/persona", async (req, res) => {
    try {
        if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email) {
            throw { codigo: 400, mensaje: "Debe completar todos los campos" };
        }
        const nombre = req.body.nombre;
        const apellido = req.body.apellido;
        const alias = req.body.alias;
        const email = req.body.email;
        let query = "SELECT email FROM persona WHERE email = ? ";
        let respuesta = await qy(query, [email]);
        if (respuesta.length > 0) {
            res.status(400).send("El email ya se encuentra registrado");
        } else {
            query = "INSERT INTO persona (nombre, apellido, alias, email) VALUE (?, ?, ?, ?)";
            respuesta = await qy(query, [nombre, apellido, alias, email]);
            let idAgregado = respuesta.insertId;
            query = "SELECT * FROM persona WHERE id = ?";
            respuesta = await qy(query, [idAgregado]);
            res.status(200).send(respuesta[0]);
        }
    }
    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
});

app.put('/api/persona/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, apellido, alias, email } = req.body //extraigo del body los atributos que quiero guardar en const
        let respuesta = await qy("SELECT * FROM persona where id=?", [req.params.id]);
        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: 'La persona ingresada no existe' }
        }

        if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email) {
            throw { codigo: 400, mensaje: 'Debe completar todos los campos' }
        }
        const respuestaUpdate = await qy(            
            'update persona set nombre=?, apellido=?, alias=? where id=? and email=?',
            [nombre, apellido, alias, id, email]
        )
        if (respuestaUpdate.affectedRows === 0) {
            throw { codigo: 400, mensaje: "El email no se puede modificar" }
        }
        const respuestaSelect = await qy('select * from persona where id=? and email=?', [id, email]) //devuelvo mi objeto updateado
        res.status(200).send(respuestaSelect[0])
    }
    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
})

app.delete("/api/persona/:id", async (req, res) => {
    try {
        // verifico que exista persona
        let query = "SELECT * FROM persona WHERE id = ?";
        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: "La persona ingresada no existe" };
        }
        //verifico que la persona no tenga libros asociados
        query = "SELECT * FROM libros WHERE id_persona = ?";
        respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0) {
            throw { codigo: 400, mensaje: "Persona con libros asociados, no se puede eliminar" };
        }
        //borro la categoria
        query = "DELETE FROM persona WHERE id = ?";
        respuesta = await qy(query, [req.params.id]);
        res.status(200).send("Persona borrada correctamente");
    }

    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
})

//LIBROS 

app.get("/api/libro", async (req, res) => {
    try {
        let query = 'SELECT * from libros';
        let respuesta = await qy(query, []);
        res.status(200).send(respuesta);
    } catch (e) {
        res.status(500).send("Error inesperado");
    }
});

app.get("/api/libro/:id", async (req, res) => {
    try {
        let query = "SELECT * FROM libros where id = ?";
        let respuesta = await qy(query, [req.params.id]);
        if (respuesta.length > 0) {
            res.json(respuesta[0]);
        } else {
            res.status(404).send("No se encuentra el libro ingresado");
        }
    }
    catch (e) {
        res.status(500).send("Error Inesperado");
    }
});

app.delete("/api/libro/:id", async (req, res) => {
    try {
        // verifico que exista el libro
        let query = "SELECT * FROM libros WHERE id = ?";
        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: "No se encuentra el libro ingresado" };
        }
        //verifico que la persona no tenga libros asociados
        query = "SELECT id_persona FROM libros WHERE id = ?";
        respuesta = await qy(query, [req.params.id]);

        if (respuesta[0].id_persona != null) {
            throw { codigo: 400, mensaje: "Libro prestado, no se puede eliminar" };
        }
        //borro la categoria
        query = "DELETE FROM libros WHERE id = ?";
        respuesta = await qy(query, [req.params.id]);
        res.status(200).send("Libro borrado correctamente");
    }

    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
})

app.post("/api/libro", async (req, res) => {
    try {
        if (!req.body.nombre || !req.body.descripcion || !req.body.id_categoria) {
            throw { codigo: 400, mensaje: "Debe completar todos los campos" };
        }
        const nombre = req.body.nombre;
        const descripcion = req.body.descripcion; 
        const id_categoria = req.body.id_categoria 
        const id_persona = req.body.id_persona 
        // Valido si ya existe libro
        let query = "SELECT * FROM libros WHERE nombre = ? ";
        let respuesta = await qy(query, [nombre]);
        if (respuesta.length > 0) {
            throw { codigo: 400, mensaje: "El libro ingresado ya estaba registrado" };
        }
        // Valido si existe categoría ingresada
        query = "SELECT * FROM categoria WHERE id= ? ";
        respuesta = await qy(query, [id_categoria]);
        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: "No existe esa categoría" };
        }
        // Valido si existe persona ingresada 
        if (id_persona != null) {
            query = "SELECT * FROM persona WHERE id = ? ";
            respuesta = await qy(query, [id_persona]);
            if (respuesta.length == 0) {
                throw { codigo: 404, mensaje: "No existe esa persona" };
            }
        }
        // QUERY DE INSERCION
        query = "INSERT INTO libros (nombre, descripcion, id_categoria, id_persona) VALUE (?, ?, ?, ?)";
        respuesta = await qy(query, [nombre, descripcion, id_categoria, id_persona]);
        let idAgregado = respuesta.insertId;
        query = "SELECT * FROM libros WHERE id = ?";
        respuesta = await qy(query, [idAgregado]);
        res.status(200).send(respuesta[0]);
    }
    catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
});

app.put('/api/libro/:id', async (req, res) => {
    try {
        // valido que el ID ingresado se corresponda a un libro
        let respuesta = await qy("SELECT * FROM libros where id=?", [req.params.id]);
        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: 'No se encuentra el libro ingresado' }
        }
        // valido que se hayan ingresado los campos nombre, descripcion y categoria
        if (!req.body.nombre || !req.body.descripcion || !req.body.id_categoria) {
            throw { codigo: 400, mensaje: 'Debe completar los campos nombre, descripción y categoría' }
        }
        // valido que no se modifiquen los campos nombre y categoria
        respuesta = await qy("SELECT * FROM libros where id=? and nombre =? and id_categoria =?", [req.params.id, req.body.nombre, req.body.id_categoria]);
        if (respuesta.length == 0) {
            throw { codigo: 400, mensaje: 'Sólo se puede modificar la descripción del libro' }
        }
        //valido que no se intente modificar desde acá la persona a la que se presta el libro, ya que eso se hace desde las rutas /prestar o /devolver
        //chequeo si puso campo id_persona, y en caso positivo, hago query para ver que no la haya cambiado
        if (req.body.id_persona) {
            respuesta = await qy("SELECT * FROM libros where id=? and id_persona =?", [req.params.id, req.body.id_persona]);
            if (respuesta.length == 0) {
                throw { codigo: 400, mensaje: 'El usuario que actualmente posee el libro se modifica desde las rutas /prestar y /devolver' }
            }
        }
        // updateo el campo descripción
        respuesta = await qy('update libros set descripcion=? where id=?', [req.body.descripcion, req.params.id]);
        //devuelvo mi objeto updateado
        respuesta = await qy('select * from libros where id=?', [req.params.id]);
        res.status(200).send(respuesta[0]);
    } catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
})

app.put('/api/libro/prestar/:id', async (req, res) => {
    try {
        // valido que el ID ingresado se corresponda a un libro
        let respuesta = await qy("SELECT * FROM libros where id=?", [req.params.id]);
        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: 'No se encuentra el libro ingresado' }
        }

        // valido que el libro no este ya prestado
        respuesta = await qy("SELECT id_persona FROM libros where id=?", [req.params.id]);
        if (respuesta[0].id_persona !== null) {
            throw { codigo: 400, mensaje: 'Este libro ya se encuentra prestado, no se puede volver a prestar hasta que no se devuelva' }
        }

        // valido que se hayan ingresado el campos id_persona
        if (!req.body.id_persona) { throw { codigo: 400, mensaje: 'Debe indicar la persona a la que se le prestará el libro' } }

        // valido que haya ingresado a una persona que se encuentre previamente cargado en la tabla persona
        respuesta = await qy("SELECT * FROM persona where id=?", [req.body.id_persona]);
        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: 'La persona a la que se le pretende prestar el libro no esta registrada' }
        }

        //valido que no se intente modificar desde acá otro dato
        if (req.body.nombre || req.body.descripcion || req.body.id_categoria) {
            throw { codigo: 400, mensaje: 'En esta ruta el unico dato admitido es el ID de la persona que recibirá el libro' }
        }

        // ejecuto la sentencia UPDATE en el campo id_persona
        respuesta = await qy('UPDATE libros SET id_persona=? WHERE id=?', [req.body.id_persona, req.params.id]);
        res.status(200).send('Se prestó correctamente');

    } catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
})

app.put('/api/libro/devolver/:id', async (req, res) => {
    try {
        // valido que el ID ingresado se corresponda a un libro
        let respuesta = await qy("SELECT * FROM libros where id=?", [req.params.id]);
        if (respuesta.length == 0) {
            throw { codigo: 404, mensaje: 'Ese libro no existe' }
        }

        // valido que el libro este prestado
        respuesta = await qy("SELECT id_persona FROM libros where id=?", [req.params.id]);
        if (respuesta[0].id_persona == null) {
            throw { codigo: 400, mensaje: 'Ese libro no estaba prestado!' }
        }
        // ejecuto la sentencia UPDATE en el campo id_persona
        respuesta = await qy('UPDATE libros SET id_persona=null WHERE id=?', [req.params.id]);

        res.status(200).send('Se realizo la devolucion correctamente');

    } catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(500).send("Error inesperado")
        }
    }
})

app.listen(port, () => { console.log("Servidor escuchando en el puerto ", port) }
);