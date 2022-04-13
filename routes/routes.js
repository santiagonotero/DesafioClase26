const path = require('path')
const {Router} = require('express')
const faker = require("../Faker/index")
const {auth}= require ('../middlewares/auth')
const passport = require('passport')
const modelProductos = require('../models/productos')
const modelMensajes = require('../models/mensajes')

const router = Router()


router.get('/', auth, async (req,res)=>{

    const items = await modelProductos.cargarProductos()
    const mensajes = await modelMensajes.cargarMensajes()  
    
    console.log(req.user)
    const name = req.user.nombre

    res.render('index' , { items: items, name: name, mensajes: mensajes})

})

router.get('/login', (req, res)=>{
    res.render('login' , {layout: 'login'})
})

router.post('/login' , passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}) 
)

router.get('/register', (req, res)=>{

    res.render('register', {layout: 'register'})
})

router.post('/register' , passport.authenticate("register", { 

    successRedirect: "/",
    failureRedirect: "/register",
    failureFlash: true
}))

router.post('/logout' , (req, res)=>{
    const {username} = req.user.nombre

    res.render('logout', {name: username})
})

router.get('/logout', auth, (req, res)=>{
    const name = req.user.nombre

    req.logOut()
    res.render('logout', {layout: 'logout', name: name })
})

router.get('/add', (req,res)=>{

    res.render('add')
})

router.post('/add', (req,res)=>{
    res.redirect('/')
})

router.get('/api/productos-test', (req,res)=>{

    const listaFake = faker.crearLista()
    res.render('faker', { listaFake: listaFake })
  })

  module.exports = router