const mongoose = require("mongoose")
mongoose.Promise = global.Promise

mongoose.set('strictQuery', false)

mongoose.connect("mongodb://127.0.0.1:27017/dbcourses",{})
    .then(() => console.log("conectado ao banco...", mongoose.connections[0].name))
    .catch((erro) => console.log(erro))

module.exports = mongoose