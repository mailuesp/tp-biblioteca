const express = require("express");
const mysql = require("mysql");
const util = require("util");

const app = express ();
const port = 3000;

app.use(express.json()); // permite mapeo de la petición JSON a object JS

const conexion = mysql.createConnection({
    host: "localhost", 
    user: "root",
    password: "", 
    database: "libros2"
});

conexion.connect((error)=>{
    if(error){throw error;} 
    console.log("Conexión con la base de datos establecida");
});

const qy = util.promisify(conexion.query).bind(conexion); // permite el uso de async-away en la conexion con mysql

// empieza la app

// GET de categorias

app.get("/api/categoria", async (req,res) => {
    try{
        query = "SELECT * FROM categoria";
        respuesta = await qy(query, []);
        res.status(200).send(respuesta); 
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }    
});

app.get("/api/categoria/:id", async (req,res) => {
    try{
        query = "SELECT * FROM categoria where id = ?";
        respuesta = await qy(query, [req.params.id]);
        if(respuesta.length > 0){
            res.json(respuesta[0]);
        } else {
            res.status(404).send("La categoría ingresada no existe");
        }         
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }    
});

app.post("/api/categoria", async (req,res) => {
    try{
        if(!req.body.nombre) {
            res.status(413).send("Debe ingresar todos los campos solicitados");
        }
        const nombre = req.body.nombre.toUpperCase();
        query = "SELECT nombre from categoria where nombre = ? ";
        respuesta = await qy(query, [nombre]);
        if(respuesta.length > 0){
            res.status(413).send("El nombre de categoría ingresado ya existe");
        }
        query = "INSERT into categoria (nombre) VALUE (?)";
        respuesta = await qy(query, [nombre]);
       // res.status(200).send(respuesta); 
        let idAgregado = respuesta.insertId;
        query = "SELECT * from categoria WHERE id = ?";
        respuesta = await qy(query, [idAgregado]);
        res.status(200).send(respuesta);
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }    
});

// Activar servidor local

app.listen(port, ()=>
    {console.log("Servidor escuchando en el puerto ", port)}
);