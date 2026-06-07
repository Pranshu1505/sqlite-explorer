// import { useState, useRef, useCallback } from 'react'
// import { useDatabase } from './useDatabase'

// const SAMPLE_CSV = `name,age,city,salary
// Alice,29,Mumbai,85000
// Bob,34,Delhi,92000
// Carol,27,Bangalore,78000
// David,41,Hyderabad,110000
// Eve,32,Chennai,88000
// Frank,25,Pune,67000`

// const STARTER_QUERIES = [
//   { label: 'All rows', sql: 'SELECT * FROM data' },
//   { label: 'Count rows', sql: 'SELECT COUNT(*) as total FROM data' },
//   { label: 'Avg salary', sql: 'SELECT city, AVG(salary) as avg_salary FROM data GROUP BY city ORDER BY avg_salary DESC' },
//   { label: 'Filter age > 30', sql: 'SELECT * FROM data WHERE age > 30' },
// ]

// export default function App() {
//   const { ready, storage, initError, exec, importCSV } = useDatabase()
//   const [sql, setSql] = useState('SELECT * FROM data')
//   const [result, setResult] = useState(null)
//   const [error, setError] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [imported, setImported] = useState(false)
//   const [importInfo, setImportInfo] = useState(null)
//   const fileRef = useRef()

//   const runQuery = useCallback(async (querySQL = sql) => {
//     if (!ready) return
//     setLoading(true)
//     setError(null)
//     try {
//       const res = await exec(querySQL)
//       setResult(res)
//     } catch (e) {
//       setError(e.message)
//       setResult(null)
//     } finally {
//       setLoading(false)
//     }
//   }, [ready, sql, exec])

//   const handleImportSample = async () => {
//     setLoading(true)
//     setError(null)
//     try {
//       const info = await importCSV(SAMPLE_CSV, 'data')
//       setImported(true)
//       setImportInfo(info)
//       const res = await exec('SELECT * FROM data')
//       setResult(res)
//     } catch (e) {
//       setError(e.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleFileUpload = async (e) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     setLoading(true)
//     setError(null)
//     try {
//       const text = await file.text()
//       const tableName = file.name.replace(/\.csv$/i, '').replace(/\s+/g, '_')
//       const info = await importCSV(text, tableName)
//       setImported(true)
//       setImportInfo(info)
//       setSql(`SELECT * FROM ${info.tableName}`)
//       const res = await exec(`SELECT * FROM ${info.tableName}`)
//       setResult(res)
//     } catch (e) {
//       setError(e.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="app">
//       {/* Header */}
//       <header>
//         <div className="header-inner">
//           <div className="logo">
//             <span className="logo-icon">◈</span>
//             <span>SQLite Explorer</span>
//           </div>
//           <div className="status-badge">
//             {!ready && !initError && <span className="badge loading">initialising…</span>}
//             {initError && <span className="badge error">failed to load</span>}
//             {ready && (
//               <span className={`badge ${storage === 'opfs' ? 'opfs' : 'memory'}`}>
//                 {storage === 'opfs' ? '⬡ OPFS persistent' : '◯ in-memory'}
//               </span>
//             )}
//           </div>
//         </div>
//       </header>

//       <main>
//         {/* Import panel */}
//         {!imported && (
//           <section className="import-panel">
//             <h2>Load data</h2>
//             <p className="hint">Import a CSV to create a SQLite table in your browser — no server required.</p>
//             <div className="import-actions">
//               <button onClick={handleImportSample} disabled={!ready || loading} className="btn-primary">
//                 Load sample data
//               </button>
//               <span className="or">or</span>
//               <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={!ready || loading}>
//                 Upload CSV
//               </button>
//               <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
//             </div>
//           </section>
//         )}

//         {imported && importInfo && (
//           <div className="import-success">
//             <span className="tick">✓</span>
//             <span>
//               Table <code>{importInfo.tableName}</code> — {importInfo.rowCount} rows · {importInfo.columns.length} columns
//             </span>
//             <button className="btn-ghost" onClick={() => { setImported(false); setResult(null) }}>reset</button>
//           </div>
//         )}

//         {/* Query editor */}
//         {imported && (
//           <section className="editor-section">
//             <div className="editor-header">
//               <span className="section-label">SQL</span>
//               <div className="quick-queries">
//                 {STARTER_QUERIES.map(q => (
//                   <button key={q.label} className="chip" onClick={() => { setSql(q.sql); runQuery(q.sql) }}>
//                     {q.label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <div className="editor-wrapper">
//               <textarea
//                 className="sql-editor"
//                 value={sql}
//                 onChange={e => setSql(e.target.value)}
//                 onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runQuery() }}
//                 spellCheck={false}
//                 rows={4}
//               />
//               <button
//                 className="run-btn"
//                 onClick={() => runQuery()}
//                 disabled={loading || !ready}
//               >
//                 {loading ? '…' : '▶ Run'}
//                 <span className="run-hint">⌘↵</span>
//               </button>
//             </div>
//           </section>
//         )}

//         {/* Error */}
//         {error && <div className="error-box"><strong>Error:</strong> {error}</div>}

//         {/* Results table */}
//         {result && !error && (
//           <section className="results-section">
//             <div className="results-header">
//               <span className="section-label">Results</span>
//               <span className="row-count">{result.rows.length} row{result.rows.length !== 1 ? 's' : ''}</span>
//             </div>
//             <div className="table-wrapper">
//               {result.rows.length === 0 ? (
//                 <p className="empty">Query returned no rows.</p>
//               ) : (
//                 <table>
//                   <thead>
//                     <tr>{result.columns.map(col => <th key={col}>{col}</th>)}</tr>
//                   </thead>
//                   <tbody>
//                     {result.rows.map((row, i) => (
//                       <tr key={i}>
//                         {row.map((cell, j) => (
//                           <td key={j}>{cell === null ? <span className="null">NULL</span> : String(cell)}</td>
//                         ))}
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </section>
//         )}
//       </main>
//     </div>
//   )
// }






import { useState, useRef, useCallback } from 'react'
import { useDatabase } from './useDatabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'

const SAMPLE_CSV = `name,age,city,salary
Alice,29,Mumbai,85000
Bob,34,Delhi,92000
Carol,27,Bangalore,78000
David,41,Hyderabad,110000
Eve,32,Chennai,88000
Frank,25,Pune,67000`

const STARTER_QUERIES = [
  { label: 'All rows', sql: 'SELECT * FROM data' },
  { label: 'Count rows', sql: 'SELECT COUNT(*) as total FROM data' },
  { label: 'Avg salary', sql: 'SELECT city, AVG(salary) as avg_salary FROM data GROUP BY city ORDER BY avg_salary DESC' },
  { label: 'Filter age > 30', sql: 'SELECT * FROM data WHERE age > 30' },
]

const CHART_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#34d399']

function isNumeric(val) {
  return val !== null && val !== '' && !isNaN(Number(val))
}

function detectChartData(columns, rows) {
  if (!rows.length || columns.length < 2) return null
  const numericCols = columns.filter((_, i) => rows.every(r => isNumeric(r[i])))
  const textCols = columns.filter((_, i) => !rows.every(r => isNumeric(r[i])))
  if (numericCols.length === 0) return null
  const labelCol = textCols[0] || columns[0]
  const labelIdx = columns.indexOf(labelCol)
  const valueCols = numericCols.slice(0, 3)
  const data = rows.map(row => {
    const obj = { label: String(row[labelIdx]) }
    valueCols.forEach(col => {
      obj[col] = Number(row[columns.indexOf(col)])
    })
    return obj
  })
  return { data, labelCol, valueCols }
}

function ChartView({ columns, rows }) {
  const [chartType, setChartType] = useState('bar')
  const detected = detectChartData(columns, rows)
  if (!detected) return null
  const { data, labelCol, valueCols } = detected

  return (
    <div className="chart-section">
      <div className="chart-header">
        <span className="section-label">Chart</span>
        <div className="chart-type-btns">
          {['bar', 'line', 'pie'].map(t => (
            <button
              key={t}
              className={`chip ${chartType === t ? 'active' : ''}`}
              onClick={() => setChartType(t)}
            >
              {t === 'bar' ? '▬ Bar' : t === 'line' ? '╱ Line' : '◉ Pie'}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d33" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#16181c', border: '1px solid #2a2d33', borderRadius: 6, color: '#d4d7de' }} />
              <Legend wrapperStyle={{ color: '#6b7280', fontSize: 12 }} />
              {valueCols.map((col, i) => (
                <Bar key={col} dataKey={col} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d33" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#16181c', border: '1px solid #2a2d33', borderRadius: 6, color: '#d4d7de' }} />
              <Legend wrapperStyle={{ color: '#6b7280', fontSize: 12 }} />
              {valueCols.map((col, i) => (
                <Line key={col} type="monotone" dataKey={col} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{ fill: CHART_COLORS[i], r: 4 }} />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey={valueCols[0]} nameKey="label" cx="50%" cy="50%" outerRadius={110} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#6b7280' }}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#16181c', border: '1px solid #2a2d33', borderRadius: 6, color: '#d4d7de' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function App() {
  const { ready, storage, initError, exec, importCSV } = useDatabase()
  const [sql, setSql] = useState('SELECT * FROM data')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState(false)
  const [importInfo, setImportInfo] = useState(null)
  const fileRef = useRef()

  const runQuery = useCallback(async (querySQL = sql) => {
    if (!ready) return
    setLoading(true)
    setError(null)
    try {
      const res = await exec(querySQL)
      setResult(res)
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [ready, sql, exec])

  const handleImportSample = async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await importCSV(SAMPLE_CSV, 'data')
      setImported(true)
      setImportInfo(info)
      const res = await exec('SELECT * FROM data')
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const text = await file.text()
      const tableName = file.name.replace(/\.csv$/i, '').replace(/\s+/g, '_')
      const info = await importCSV(text, tableName)
      setImported(true)
      setImportInfo(info)
      setSql(`SELECT * FROM ${info.tableName}`)
      const res = await exec(`SELECT * FROM ${info.tableName}`)
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span>SQLite Explorer</span>
          </div>
          <div className="status-badge">
            {!ready && !initError && <span className="badge loading">initialising…</span>}
            {initError && <span className="badge error">failed to load</span>}
            {ready && (
              <span className={`badge ${storage === 'opfs' ? 'opfs' : 'memory'}`}>
                {storage === 'opfs' ? '⬡ OPFS persistent' : '◯ in-memory'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main>
        {!imported && (
          <section className="import-panel">
            <h2>Load data</h2>
            <p className="hint">Import a CSV to create a SQLite table in your browser — no server required.</p>
            <div className="import-actions">
              <button onClick={handleImportSample} disabled={!ready || loading} className="btn-primary">
                Load sample data
              </button>
              <span className="or">or</span>
              <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={!ready || loading}>
                Upload CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          </section>
        )}

        {imported && importInfo && (
          <div className="import-success">
            <span className="tick">✓</span>
            <span>Table <code>{importInfo.tableName}</code> — {importInfo.rowCount} rows · {importInfo.columns.length} columns</span>
            <button className="btn-ghost" onClick={() => { setImported(false); setResult(null) }}>reset</button>
          </div>
        )}

        {imported && (
          <section className="editor-section">
            <div className="editor-header">
              <span className="section-label">SQL</span>
              <div className="quick-queries">
                {STARTER_QUERIES.map(q => (
                  <button key={q.label} className="chip" onClick={() => { setSql(q.sql); runQuery(q.sql) }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="editor-wrapper">
              <textarea
                className="sql-editor"
                value={sql}
                onChange={e => setSql(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runQuery() }}
                spellCheck={false}
                rows={4}
              />
              <button className="run-btn" onClick={() => runQuery()} disabled={loading || !ready}>
                {loading ? '…' : '▶ Run'}
                <span className="run-hint">⌘↵</span>
              </button>
            </div>
          </section>
        )}

        {error && <div className="error-box"><strong>Error:</strong> {error}</div>}

        {result && !error && (
          <>
            <ChartView columns={result.columns} rows={result.rows} />

            <section className="results-section">
              <div className="results-header">
                <span className="section-label">Results</span>
                <span className="row-count">{result.rows.length} row{result.rows.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="table-wrapper">
                {result.rows.length === 0 ? (
                  <p className="empty">Query returned no rows.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>{result.columns.map(col => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell === null ? <span className="null">NULL</span> : String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}