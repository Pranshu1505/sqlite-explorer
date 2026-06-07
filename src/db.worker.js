/**
 * db.worker.js
 * Runs SQLite entirely inside a Web Worker.
 * Communicates with the main thread via postMessage.
 *
 * Message protocol:
 *   IN  { id, type: 'exec', sql, params? }
 *   IN  { id, type: 'import', csvText, tableName }
 *   OUT { id, ok: true, rows, columns }
 *   OUT { id, ok: false, error }
 */

/**
 * db.worker.js - Uses sqlite3Worker1Promiser (correct API for this package)
 */
import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm'

let promiser = null
let dbId = null

async function init() {
  promiser = await new Promise((resolve) => {
    const p = sqlite3Worker1Promiser({
      onready: () => resolve(p),
    })
  })

  const openResult = await promiser('open', {
    filename: 'file:///explorer.db?vfs=opfs',
  })
  dbId = openResult.dbId
  postMessage({ type: 'ready', storage: 'opfs' })
}

async function execSQL(sql, params = []) {
  const rows = []
  const columns = []
  let colsCaptured = false

  await promiser('exec', {
    dbId,
    sql,
    bind: params,
    callback: (result) => {
      if (result.row) {
        if (!colsCaptured) {
          columns.push(...result.columnNames)
          colsCaptured = true
        }
        rows.push(result.row)
      }
    },
  })
  return { rows, columns }
}

async function importCSV(csvText, tableName) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV must have a header and at least one data row')

  const parseRow = (line) => {
    const result = []
    let current = '', inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
      current += ch
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0])
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '_')
  const safeCols = headers.map(h => `"${h.replace(/"/g, '')}"`)

  await promiser('exec', { dbId, sql: `DROP TABLE IF EXISTS "${safeTable}"` })
  await promiser('exec', { dbId, sql: `CREATE TABLE "${safeTable}" (${safeCols.join(', ')})` })
  await promiser('exec', { dbId, sql: 'BEGIN' })

  try {
    const placeholders = headers.map(() => '?').join(', ')
    const insertSQL = `INSERT INTO "${safeTable}" VALUES (${placeholders})`
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      await promiser('exec', { dbId, sql: insertSQL, bind: parseRow(lines[i]) })
    }
    await promiser('exec', { dbId, sql: 'COMMIT' })
  } catch (e) {
    await promiser('exec', { dbId, sql: 'ROLLBACK' })
    throw e
  }

  const preview = await execSQL(`SELECT * FROM "${safeTable}" LIMIT 5`)
  return { ...preview, rowCount: lines.length - 1, tableName: safeTable }
}

self.onmessage = async ({ data }) => {
  const { id, type } = data
  try {
    if (type === 'exec') {
      const result = await execSQL(data.sql, data.params)
      postMessage({ id, ok: true, ...result })
    } else if (type === 'import') {
      const result = await importCSV(data.csvText, data.tableName)
      postMessage({ id, ok: true, ...result })
    }
  } catch (err) {
    postMessage({ id, ok: false, error: err.message })
  }
}

init().catch(err => postMessage({ type: 'error', error: err.message }))