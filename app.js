const app = require('./config/express')
const ImportUmov = require('./utils/ImportUmov.js')
const port = 3000
app.listen(port, (() => {
    console.log("servidor rodando na porta", port)
    ImportUmov.build()
}))