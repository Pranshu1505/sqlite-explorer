import { useState, useEffect, useCallback, useRef } from 'react'

export function useDatabase() {
  const [ready, setReady] = useState(false)
  const [storage, setStorage] = useState(null)
  const [initError, setInitError] = useState(null)
  const dbRef = useRef(null)

  useEffect(() => {
    async function init() {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = '/sql-wasm.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })

        const SQL = await window.initSqlJs({
          locateFile: () => '/sql-wasm.wasm'
        })

        dbRef.current = new SQL.Database()
        setStorage('memory')
        setReady(true)
      } catch (e) {
        console.error('SQLite init error:', e)
        setInitError(e.message)
      }
    }
    init()
  }, [])

  const exec = useCallback(async (sql, params = []) => {
    const results = dbRef.current.exec(sql, params)
    if (!results.length) return { rows: [], columns: [] }
    return {
      columns: results[0].columns,
      rows: results[0].values,
    }
  }, [])

  const importCSV = useCallback(async (csvText, tableName) => {
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
    const db = dbRef.current

    db.run(`DROP TABLE IF EXISTS "${safeTable}"`)
    db.run(`CREATE TABLE "${safeTable}" (${safeCols.join(', ')})`)

    const placeholders = headers.map(() => '?').join(', ')
    const insertSQL = `INSERT INTO "${safeTable}" VALUES (${placeholders})`
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      db.run(insertSQL, parseRow(lines[i]))
    }

    const preview = await exec(`SELECT * FROM "${safeTable}" LIMIT 5`)
    return { ...preview, rowCount: lines.length - 1, tableName: safeTable }
  }, [exec])

  return { ready, storage, initError, exec, importCSV }
}