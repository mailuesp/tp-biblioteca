const express = require("express");
const mysql = require("mysql");
const util = require("util");

const app = express();
const port = 3000;

app.use(express.json()); // permite mapeo de la petición JSON a object JS

const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "libros2"
});

conexion.connect((error) => {
    if (error) { throw error; }
    console.log("Conexión con la base de datos establecida");
});

const qy = util.promisify(conexion.query).bind(conexion); // permite el uso de async-away en la conexion con mysql

// empieza la app

// GET de categorias

app.get("/api/categoria", async (req, res) => {
    try {
        let query = "SELECT * FROM categoria";
        let respuesta = await qy(query, []);
        res.status(200).send(respuesta);
    }
    catch (e) {
        res.status(413).send({ "Error": e.message });
    }
});

app.get("/api/categoria/:id", async (req, res) => {
    try {
        let query = "SELECT * FROM categoria where id = ?";
        let respuesta = await qy(query, [req.params.id]);
        if (respuesta.length > 0) {
            res.json(respuesta[0]);
        } else {
            res.status(404).send("La categoría ingresada no existe");
        }
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

app.delete("/api/categoria/:id", async (req, res) => {
    try {
        // verifico que exista categoria
        let query = "SELECT * FROM categoria WHERE id = ?";
        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw new Error("La categoría ingresada no existe");
        }
        //verifico que la categoría no tenga libros asociados
        query = "SELECT * FROM libros WHERE id_categoria = ?";
        respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0) {
            throw new Error("Categoría con libros asociados, no se puede eliminar");
        }
        //borro la categoria
        query = "DELETE FROM categoria WHERE id = ?";
        respuesta = await qy(query, [req.params.id]);
        res.status(200).send("Categoría borrada correctamente");
    }

    catch (e) {
        res.status(413).send({ "Error": e.message });
    }
})

app.post("/api/categoria", async (req, res) => {
    try {
        if (!req.body.nombre) {
            throw new Error('Debe ingresar todos los campos solicitados');
        }
        const nombre = req.body.nombre.toUpperCase();
        let query = "SELECT nombre from categoria where nombre = ? ";
        let respuesta = await qy(query, [nombre]);
        if (respuesta.length > 0) {
            throw new Error("El nombre de categoría ingresado ya existe");
        }
        query = "INSERT into categoria (nombre) VALUE (?)";
        respuesta = await qy(query, [nombre]);
        // res.status(200).send(respuesta); 
        let idAgregado = respuesta.insertId;
        query = "SELECT * from categoria WHERE id = ?";
        respuesta = await qy(query, [idAgregado]);
        res.status(200).send(respuesta);
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});


// PERSONA 
//German
// retorna status 200 
// y [{id: numerico, nombre: string, apellido: string, alias: string, email; string}] 
// o bien status 413 y []
app.get("/api/persona", async (req, res) => {
    try {
        let query = 'SELECT * from persona';
        let respuesta = await qy(query, []);
        res.status(200).send(respuesta);
    } catch (e) {
        res.status(413).send({ "Error": e.message });
    }
});

//Alan
// recibe: {nombre: string, apellido: string, alias: string, email: string} retorna: status: 200, 
// {id: numerico, nombre: string, apellido: string, alias: string, email: string} 
// - status: 413, {mensaje: <descripcion del error>} que puede ser: "faltan datos", 
// "el email ya se encuentra registrado", "error inesperado"
app.post("/api/persona", async (req, res) => {
    try {
        if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email) {
            res.status(413).send("Debe completar todos los campos");
        }
        const nombre = req.body.nombre.toUpperCase();
        const apellido = req.body.apellido.toUpperCase();
        const alias = req.body.alias.toUpperCase();
        const email = req.body.email.toUpperCase();
        let query = "SELECT email FROM persona WHERE email = ? ";
        let respuesta = await qy(query, [email]);
        if (respuesta.length > 0) {
            res.status(413).send("El email ya se encuentra registrado");
        } else {
            query = "INSERT INTO persona (nombre, apellido, alias, email) VALUE (?, ?, ?, ?)";
            respuesta = await qy(query, [nombre, apellido, alias, email]);
            let idAgregado = respuesta.insertId;
            query = "SELECT * FROM persona WHERE id = ?";
            respuesta = await qy(query, [idAgregado]);
            res.status(200).send(respuesta);
        }
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});


//Mailu: PUT persona/:id
// PUT '/persona/:id' recibe: {nombre: string, apellido: string, alias: string, email: string} el email no se puede modificar. 
// retorna status 200 y el objeto modificado o bien status 413,
//  {mensaje: <descripcion del error>} "error inesperado", "no se encuentra esa persona"
app.put('/api/persona/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, apellido, alias, email } = req.body.toUpperCase() //extraigo del body los atributos que quiero guardar en const
        let respuesta = await qy("SELECT * FROM persona where id=?", [req.params.id]);
        if (respuesta.length == 0) {
            throw { codigo: 413, mensaje: 'La persona ingresada no existe' }
        }

        if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email) {
            throw { codigo: 413, mensaje: 'Debe completar todos los campos' }
        }
        const respuestaUpdate = await qy(
            //pongo el email como condicion porque tmb lo recibo y no sé
            'update persona set nombre=?, apellido=?, alias=? where id=? and email=?',
            [nombre, apellido, alias, id, email]
        )
        if (respuestaUpdate.affectedRows === 0) {
            throw { codigo: 404, mensaje: "El email no se puede modificar" }
        }
        const respuestaSelect = await qy('select * from persona where id=? and email=?', [id, email]) //devuelvo mi objeto updateado
        res.status(200).send(respuestaSelect[0])
    } catch (error) {
        if (error.codigo) {
            res.status(error.codigo).send(error.mensaje)
        } else {
            res.status(413).send("Error inesperado")
        }

    }
})



//LIBROS



// Activar servidor local

app.listen(port, () => { console.log("Servidor escuchando en el puerto ", port) }
);