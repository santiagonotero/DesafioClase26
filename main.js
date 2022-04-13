(async()=>{
let express = require("express");
let app = express();
let server = require("http").Server(app);
let io = require("socket.io")(server);
const {engine} = require ("express-handlebars")
const path = require("path")
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const Filestore = require('session-file-store')(session)
const passport = require('passport')
const flash = require('express-flash')
const initializePassport = require('./Passport/local')
const prodMethod = require('./models/productos')
const msgMethod = require('./models/mensajes')
const { HOSTNAME, SCHEMA, DATABASE, USER, PASSWORD, OPTIONS } = require("./DBconfig/Mongo")
const homeRouter = require('./routes/routes')

const PORT = process.env.PORT || 8080

mongoose.connect(`${SCHEMA}://${USER}:${PASSWORD}@${HOSTNAME}/${DATABASE}?${OPTIONS}`).then(()=>{
  console.log("Conectado con base de datos MongoDB")
})

let messagePool=[]
let productList=[]

initializePassport(passport)

app.use("/static/", express.static(path.join(__dirname, "public")))

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(flash())
app.use(cookieParser("Esto es un secreto"))
app.use(session({
  secret:"secret",
  resave: true,
  saveUninitialized:true,
  
  store:new MongoStore({
    mongoUrl: `${SCHEMA}://${USER}:${PASSWORD}@${HOSTNAME}/${DATABASE}?${OPTIONS}`,
    expires: 60,
    createdAt: new Date(),
    autoRemove: 'native',
    autoRemoveInterval: 1,
    ttl: 60, 
    autoRemove: true,
    delete: true
  })
}))

app.use(passport.initialize())
app.use(passport.session())


app.set('view engine', 'hbs')
  
app.engine('hbs',engine({
  layoutsDir: path.join(__dirname,'/views'),
  extname: 'hbs',
  defaultLayout:'index'
}))

app.use('/', homeRouter)

// iniciamos la conexión del socket
io.on("connection", async function (socket) {   //Mensaje que indica una conexión. 
  console.log("Un cliente se ha conectado")

  messagePool = await msgMethod.cargarMensajes()
  productList = await prodMethod.cargarProductos()

  socket.emit("messages", messagePool)

  prodMethod.cargarProductos().then((listaProductos)=>{
    socket.emit('server:productList', listaProductos)
  })

  socket.on('new-message', async (data)=>{  // Mensaje que indica un nuevo mensaje de chat recibido
      msgMethod.appendMessage(data)  // Almacenar mensaje en la base de datos
      messagePool = await msgMethod.cargarMensajes()
      io.sockets.emit("messages", messagePool)
    })

  socket.on('new-product', (prodInfo)=>{ //Mensaje que indica un nuevo producto agregado al stock de productos
    prodInfo.precio = JSON.parse(prodInfo.precio)
    prodMethod.agregarProducto(prodInfo) // Almacenar nuevo producto en la base de datos
      
    //Desnormalización de datos de product
      
    prodMethod.cargarProductos().then((listaProductos)=>{

      productList = prodMethod.data
      console.log('main.js-> mensaje new-product: ' + listaProductos)
      
      io.sockets.emit('server:productList', listaProductos)
    })
  })    
    
})

server.listen(PORT, function () {
    console.log("Servidor corriendo en http://localhost:8080")
  })

})()
