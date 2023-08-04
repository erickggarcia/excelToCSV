const XLSX = require('xlsx')
const fs = require('fs')
const validationRules = require('../templates/serviceLocal.json')

class ImportUmov {
  constructor() {}

  readExcel(xlsx) {
    const workbook = XLSX.readFile(xlsx)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    return data
  }

  extractHeaderAndData([...arrays]) {
    const list = []
    const keys = arrays[0]
    const values = arrays.slice(1)
    for (let i = 0; i < values.length; i++) {
      const row = values[i]

      let object = {}
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j]
        object[key] = row[j]
        if (typeof object['cityNeighborhood'] !== 'undefined') {
          if (object['cityNeighborhood'].length >= 50) {
            object['cityNeighborhood'] = object['cityNeighborhood'].slice(0, 10)
          }
        }

        if (typeof object['streetComplement'] !== 'undefined') {
          if (object['streetComplement'].length >= 50) {
            object['streetComplement'] = object['streetComplement'].slice(0, 40)
          }
        }

        if (
          typeof object['streetNumber'] !== 'undefined' &&
          isNaN(object['streetNumber'])
        ) {
          object['street'] += ', ' + object['streetNumber']
          object['streetNumber'] = ''
        }
      }

      object['erros'] = ''
      list.push(object)
    }

    keys.push('erros')

    return {
      header: keys,
      data: list,
    }
  }

  modifyRows(data) {
    const list = []
    for (let i = 0; i < data.length; i++) {
      const row = this.clearRows(data[i])
      const modifiedRow = this.validateRules(row)
      list.push(modifiedRow)
    }
    return list
  }

  clearRows(row) {
    const modifiedRow = {}
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const value = row[key]
        if (typeof value === 'string') {
          modifiedRow[key] = value
            .replace(/;/g, ',')
            .replace(/(\r\n|\n|\r)/gm, '')
            .replace(/\t+/g, ' ')
        } else {
          modifiedRow[key] =
            typeof value === 'undefined' || typeof value === 'null' ? '' : value
        }
      }
    }
    return modifiedRow
  }

  validateRules(obj) {
    for (let i = 0; i < validationRules.length; i++) {
      const rule = validationRules[i]
      if (typeof obj[rule.col] === 'undefined' && rule.required === true) {
        obj['erros'] += `${rule.col} está vazio, `
      }

      if (typeof obj[rule.col] !== 'undefined') {
        if (obj[rule.col].length > rule.size) {
          obj[
            'erros'
          ] += `O tamanho de ${rule.col} não pode ser maior que ${rule.size}, `
        }

        if (rule.type === 'number') {
          if (isNaN(obj[rule.col])) {
            obj['erros'] += `${rule.col} tipo inválido, `
          }
        }
      }
    }
    return obj
  }

  splitFiles(data) {
    const numberFiles = 5
    const list = []
    const divider = Math.ceil(data.length / numberFiles)
    for (let i = 0; i < numberFiles; i++) {
      let start = i * divider
      let end = (i + 1) * divider
      list.push(data.slice(start, end))
    }
    return list
  }

  objectToCSV(header, data) {
    const rows = []
    rows.push(header.join(';'))
    for (let i = 0; i < data.length; i++) {
      let values = []
      for (let j = 0; j < header.length; j++) {
        const coluna = header[j]
        values.push(data[i][coluna])
      }
      rows.push(values.join(';'))
    }
    return rows.join('\n')
  }

  writeCSV(csv, fileName) {
    const stream = fs.createWriteStream(`./files/csv/${fileName}`, {
      encoding: 'utf8',
    })
    stream.write('\uFEFF')

    stream.write('C\n' + csv, 'utf8')
    stream.end()

    stream.on('finish', () => {
      console.log('O arquivo CSV foi gravado com sucesso!')
    })

    stream.on('error', err => {
      console.error('Ocorreu um erro ao gravar o arquivo CSV:', err)
    })
  }

  build() {
    const excel = this.readExcel('./files/locais_revenda.xlsx')
    const { header, data } = this.extractHeaderAndData(excel)
    const processedRows = this.modifyRows(data)
    const files = this.splitFiles(processedRows)
    for (let i = 0; i < files.length; i++) {
      const dataFile = files[i]
      const csv = this.objectToCSV(header, dataFile)
      this.writeCSV(csv, `LOC00${i}_v2.csv`)
    }
  }
}
module.exports = new ImportUmov()
