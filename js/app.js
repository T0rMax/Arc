;(function () {
  'use strict'

  // ============================
  // STATE
  // ============================
  const state = {
    currentSection: 'dashboard',
    calcDivisor: 100,
    favFilterActive: false,
    rounding: 2,
    animations: true,
    accentColor: 'blue',
    scaleHistory: [],
    formulaHistory: [],
    sciHistory: [],
    formulas: [],
    categories: ['arquitectura', 'fisica', 'matematica', 'personalizadas'],
    currentFormulaCategory: 'arquitectura',
    pinnedFormulas: [],
    version: '4.0.0'
  }

  const accentMap = {
    blue: '#42a5f5', purple: '#ab47bc', green: '#66bb6a',
    orange: '#ffa726', red: '#ef5350', teal: '#26a69a'
  }

  // ============================
  // STORAGE
  // ============================
  function loadState () {
    try {
      const s = localStorage.getItem('arc_state')
      if (s) Object.assign(state, JSON.parse(s))
      const f = localStorage.getItem('arc_formulas')
      if (f) state.formulas = JSON.parse(f)
      const sh = localStorage.getItem('arc_scale_history')
      if (sh) state.scaleHistory = JSON.parse(sh)
      const fh = localStorage.getItem('arc_formula_history')
      if (fh) state.formulaHistory = JSON.parse(fh)
      const sch = localStorage.getItem('arc_sci_history')
      if (sch) state.sciHistory = JSON.parse(sch)
      const p = localStorage.getItem('arc_pinned')
      if (p) state.pinnedFormulas = JSON.parse(p)
    } catch (e) {}
    state.version = '4.0.0'
    // Ensure arrays exist
    if (!state.scaleHistory) state.scaleHistory = []
    if (!state.formulaHistory) state.formulaHistory = []
    if (!state.sciHistory) state.sciHistory = []
    if (!state.pinnedFormulas) state.pinnedFormulas = []
  }

  function persistState () {
    try {
      const s = { ...state }
      delete s.formulas; delete s.scaleHistory; delete s.formulaHistory
      delete s.sciHistory; delete s.pinnedFormulas; delete s.calcMultiplier
      localStorage.setItem('arc_state', JSON.stringify(s))
      localStorage.setItem('arc_formulas', JSON.stringify(state.formulas))
      localStorage.setItem('arc_scale_history', JSON.stringify(state.scaleHistory))
      localStorage.setItem('arc_formula_history', JSON.stringify(state.formulaHistory))
      localStorage.setItem('arc_sci_history', JSON.stringify(state.sciHistory))
      localStorage.setItem('arc_pinned', JSON.stringify(state.pinnedFormulas))
    } catch (e) {}
  }

  // ============================
  // ROUNDING
  // ============================
  function roundValue (value, decimals) {
    if (decimals === 0) return value
    const f = Math.pow(10, decimals)
    return Math.round(value * f) / f
  }

  function smartFormatNum (value, maxDec) {
    if (value === undefined || value === null || !isFinite(value)) return '—'
    if (maxDec === 0) return String(Math.round(value))
    var rounded = parseFloat(value.toPrecision(12))
    var str = rounded.toFixed(maxDec)
    str = str.replace(/\.?0+$/, '')
    return str
  }

  function formatNumber (value, decimals) {
    if (decimals === 0) return String(value)
    return smartFormatNum(value, decimals)
  }

  function escHtml (s) {
    var div = document.createElement('div')
    div.appendChild(document.createTextNode(s))
    return div.innerHTML
  }

  // ============================
  // TOAST
  // ============================
  function showToast (message) {
    const container = document.getElementById('toastContainer') || createToastContainer()
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    container.appendChild(toast)
    setTimeout(() => {
      toast.classList.add('removing')
      setTimeout(() => toast.remove(), 250)
    }, 2200)
  }

  function createToastContainer () {
    const div = document.createElement('div')
    div.id = 'toastContainer'
    div.className = 'toast-container'
    document.body.appendChild(div)
    return div
  }

  // ============================
  // NAVIGATION
  // ============================
  function navigateTo (section) {
    state.currentSection = section
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'))
    const target = document.getElementById('section-' + section)
    if (target) target.classList.add('active')
    document.querySelectorAll('.sidebar-nav .nav-item, .bnav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section)
    })
    const sidebar = document.getElementById('sidebar')
    sidebar.classList.remove('open')
    const content = document.querySelector('.content')
    if (content) content.scrollTop = 0
    if (section === 'dashboard') updateDashboard()
    if (section === 'historial') renderHistory()
    persistState()
  }

  // ============================
  // DASHBOARD
  // ============================
  function updateDashboard () {
    const now = new Date()
    const hour = now.getHours()
    let greeting = 'Buenos días'
    if (hour >= 12 && hour < 19) greeting = 'Buenas tardes'
    else if (hour >= 19 || hour < 6) greeting = 'Buenas noches'
    const el = document.getElementById('dashGreeting')
    if (el) el.textContent = greeting

    const dateStr = now.toLocaleDateString('es-ES')
    const allHistory = [...state.scaleHistory, ...state.formulaHistory, ...state.sciHistory]
    const todayCount = allHistory.filter(h => h.date === dateStr).length
    const calcEl = document.getElementById('dashCalcCount')
    if (calcEl && calcEl.textContent !== String(todayCount)) { calcEl.textContent = todayCount; animatePop(calcEl) }
    const formEl = document.getElementById('dashFormulaCount')
    if (formEl && formEl.textContent !== String(state.formulas.length)) { formEl.textContent = state.formulas.length; animatePop(formEl) }
    const favEl = document.getElementById('dashFavCount')
    if (favEl && favEl.textContent !== String(state.pinnedFormulas.length)) { favEl.textContent = state.pinnedFormulas.length; animatePop(favEl) }

    // Recent calcs (from all histories)
    const recentList = document.getElementById('dashRecentList')
    const recent = allHistory.slice().sort((a, b) => b.id - a.id).slice(0, 5)
    if (recent.length === 0) {
      recentList.innerHTML = '<div class="dash-empty"><p>Aún no hay cálculos</p></div>'
    } else {
      recentList.innerHTML = recent.map(h => {
        const typeLabel = { escalas: 'Esc', formulas: 'Frm', cientifica: 'Sci' }[h.type] || ''
        return `<div class="dash-recent-item">
          <span class="dash-recent-item-result">${h.result}</span>
          <div class="dash-recent-item-info">${typeLabel} · ${h.time}<br>${h.formula}</div>
        </div>`
      }).join('')
    }

    // Pinned formulas
    const pinnedList = document.getElementById('dashPinnedList')
    const pinned = state.pinnedFormulas.length > 0
      ? state.formulas.filter(f => state.pinnedFormulas.includes(f.id))
      : state.formulas.slice(0, 4)
    if (pinned.length === 0) {
      pinnedList.innerHTML = '<div class="dash-empty"><p>Sin fórmulas favoritas</p></div>'
    } else {
      pinnedList.innerHTML = pinned.map(f => `
        <div class="dash-pinned-item" data-id="${f.id}">
          <svg viewBox="0 0 24 24" class="pinned-icon" width="16" height="16"><path d="M16 11c0 1.66-1.34 3-3 3h-2v5h-2v-5H7v-3h2V6c0-1.66 1.34-3 3-3s3 1.34 3 3v5h2v3h-1z" fill="currentColor"/></svg>
          ${f.name}
        </div>
      `).join('')
    }
  }

  // ============================
  // SCALE CALCULATOR — Rewritten v4.0
  // ============================
  let scaleMode = 'real-to-scale'

  function calculateScale () {
    const x = parseFloat(document.getElementById('calcInput').value)
    const div = parseFloat(document.getElementById('divisorInput').value) || 1
    const rounding = state.rounding
    const modeEl = document.getElementById('scaleModeSelect')

    if (modeEl) scaleMode = modeEl.value

    if (isNaN(x)) {
      document.getElementById('resultValue').textContent = '—'
      document.getElementById('calcDisplay').textContent = '0'
      return null
    }

    let result
    let formulaLabel

    if (scaleMode === 'real-to-scale') {
      result = x / div
      formulaLabel = `${smartFormatNum(x, 6)} ÷ ${div}`
    } else if (scaleMode === 'scale-to-real') {
      result = x * div
      formulaLabel = `${smartFormatNum(x, 6)} × ${div}`
    } else {
      const fromScale = parseFloat(document.getElementById('fromScaleInput').value) || 1
      result = x * fromScale / div
      formulaLabel = `${smartFormatNum(x, 6)} × ${fromScale} ÷ ${div}`
    }

    const rounded = roundValue(result, rounding)
    const formatted = smartFormatNum(rounded, rounding)
    document.getElementById('calcDisplay').textContent = formatted
    document.getElementById('resultValue').textContent = formatted
    document.getElementById('calcFormulaLabel').textContent = formulaLabel

    animatePop(document.getElementById('calcDisplay'))

    return { x, mult: scaleMode === 'real-to-scale' ? 1 : div, div, result: formatted, raw: rounded }
  }

  function addScaleHistory (x, mult, div, result) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toLocaleDateString('es-ES')
    const labels = { 'real-to-scale': 'Real→Esc', 'scale-to-real': 'Esc→Real', 'scale-to-scale': 'Esc→Esc' }
    const modeLabel = labels[scaleMode] || ''
    const entry = {
      id: Date.now(),
      type: 'escalas',
      x, mult, div, result,
      time: timeStr, date: dateStr,
      formula: `${modeLabel}: ${document.getElementById('calcFormulaLabel').textContent} = ${result}`
    }
    state.scaleHistory.unshift(entry)
    if (state.scaleHistory.length > 200) state.scaleHistory.length = 200
    persistState()
  }

  function applyScalePreset (scale) {
    document.getElementById('divisorInput').value = String(scale)
    document.querySelectorAll('.preset-chip.scale-preset').forEach(b => {
      b.classList.toggle('active', parseFloat(b.dataset.scale) === scale)
    })
    document.getElementById('calcInput').focus()
    triggerScaleCalc()
    showToast(`Escala 1:${scale} aplicada`)
  }

  let scaleCalcTimeout
  function triggerScaleCalc () {
    clearTimeout(scaleCalcTimeout)
    scaleCalcTimeout = setTimeout(() => {
      const res = calculateScale()
      if (res) {
        addScaleHistory(res.x, res.mult, res.div, res.result)
      }
    }, 250)
  }

  // ============================
  // FORMULA CALCULATOR ENGINE
  // ============================
  let formulaCalcExpr = ''
  let formulaCalcVars = {}
  let formulaCalcCurrentId = null

  function detectVariables (expr) {
    if (!expr) return []
    const mathFuncs = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'exp']
    // Find single-letter tokens that aren't Math functions or numbers
    const tokens = expr.match(/[a-zA-Z]+/g) || []
    const vars = new Set()
    for (const t of tokens) {
      if (t.length === 1 && !mathFuncs.includes(t) && t !== 'e' && t !== 'g') {
        vars.add(t)
      }
    }
    return Array.from(vars).sort()
  }

  function evalFormulaExpr (expr, varValues) {
    let sanitized = expr
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/\^/g, '**')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/π/g, 'Math.PI')
      .replace(/pi/gi, 'Math.PI')

    // Replace variable names with their values
    for (const [v, val] of Object.entries(varValues)) {
      if (val !== undefined && val !== '') {
        const re = new RegExp('\\b' + v + '\\b', 'g')
        sanitized = sanitized.replace(re, String(val))
      }
    }

    if (!/^[\d\s+\-*/().,%a-zA-Z]+$/.test(sanitized)) return null
    let open = (sanitized.match(/\(/g) || []).length
    let close = (sanitized.match(/\)/g) || []).length
    while (close < open) { sanitized += ')'; close++ }
    try { return Function('"use strict"; return (' + sanitized + ')')() }
    catch (e) { return null }
  }

  function renderMathPreview (expr) {
    const previewEl = document.getElementById('formulaPreview')
    if (!previewEl) return
    const mathEl = previewEl.querySelector('.formula-preview-math')
    const placeholder = previewEl.querySelector('.formula-preview-placeholder')
    if (!expr) {
      mathEl.classList.remove('visible')
      placeholder.style.display = ''
      return
    }
    placeholder.style.display = 'none'
    const mathFuncs = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'exp']
    let html = ''
    let i = 0
    while (i < expr.length) {
      // Check for fraction a/b (greedy)
      if (/[a-zA-Z0-9π.ε]/.test(expr[i]) && i + 1 < expr.length && expr[i + 1] === '/' && i + 2 < expr.length && /[a-zA-Z0-9π(]/.test(expr[i + 2])) {
        let numEnd = i + 1
        let denStart = i + 2
        let denEnd = denStart
        while (denEnd < expr.length && /[a-zA-Z0-9π.ε]/.test(expr[denEnd])) denEnd++
        // Skip if numerator is part of a math function
        if (!mathFuncs.some(f => expr.slice(i - f.length + 1, i + 1) === f)) {
          html += `<span class="math-frac"><span class="frac-num">${escHtml(expr.slice(i, numEnd))}</span><span class="frac-den">${escHtml(expr.slice(denStart, denEnd))}</span></span>`
          i = denEnd
          continue
        }
      }
      // Check for power x^n
      if (/[a-zA-Z0-9π.)ε]/.test(expr[i]) && i + 1 < expr.length && expr[i + 1] === '^') {
        const baseEnd = i + 1
        let expStart = i + 2
        let expEnd = expStart
        if (expStart < expr.length && expr[expStart] === '(') { let d = 1; expEnd = expStart + 1; while (expEnd < expr.length && d > 0) { if (expr[expEnd] === '(') d++; if (expr[expEnd] === ')') d--; expEnd++ } }
        else { while (expEnd < expr.length && /[a-zA-Z0-9π]/.test(expr[expEnd])) expEnd++ }
        html += `<span class="math-power"><span class="power-base">${escHtml(expr.slice(i, baseEnd))}</span><span class="power-exp">${escHtml(expr.slice(expStart, expEnd))}</span></span>`
        i = expEnd
        continue
      }
      // Check for sqrt
      if (expr[i] === '√' || expr.slice(i, i + 4) === 'sqrt') {
        const skip = expr[i] === '√' ? 1 : 4
        let innerStart = i + skip
        if (expr[innerStart] === '(') { let d = 1; innerStart++; let end = innerStart; while (end < expr.length && d > 0) { if (expr[end] === '(') d++; if (expr[end] === ')') d--; end++ }
          html += `<span class="math-sqrt"><span class="sqrt-symbol">√</span><span class="sqrt-body">${escHtml(expr.slice(innerStart, end - 1))}</span></span>`
          i = end; continue
        }
        html += '√'; i++; continue
      }
      // Check for math functions
      const matchedFn = mathFuncs.find(f => expr.slice(i, i + f.length) === f && (i + f.length >= expr.length || !/[a-zA-Z]/.test(expr[i + f.length])))
      if (matchedFn) {
        html += `<span class="math-symbol">${escHtml(matchedFn)}</span>`
        i += matchedFn.length; continue
      }
      if (/[a-zA-Z]/.test(expr[i])) {
        let varEnd = i
        while (varEnd < expr.length && /[a-zA-Z]/.test(expr[varEnd])) varEnd++
        html += `<span class="math-symbol">${escHtml(expr.slice(i, varEnd))}</span>`
        i = varEnd; continue
      }
      if (/[\d.]/.test(expr[i])) {
        let numEnd = i
        while (numEnd < expr.length && /[\d.eE]/.test(expr[numEnd])) numEnd++
        html += `<span class="math-num">${escHtml(expr.slice(i, numEnd))}</span>`
        i = numEnd; continue
      }
      if ('+-*/()'.includes(expr[i])) {
        html += `<span class="math-op">${escHtml(expr[i])}</span>`
        i++; continue
      }
      html += escHtml(expr[i]); i++
    }
    mathEl.innerHTML = html
    mathEl.classList.add('visible')
  }

  function updateErrorDisplay (msg) {
    const errEl = document.getElementById('formulaError')
    if (!errEl) return
    if (msg) {
      errEl.textContent = msg
      errEl.classList.add('visible')
      document.getElementById('formulaCalcResult').textContent = '—'
    } else {
      errEl.classList.remove('visible')
    }
  }

  // MINI GRAPH — REMOVED in v4.0

  function formulaCalcUpdate () {
    const exprInput = document.getElementById('formulaCalcExpr')
    const varsContainer = document.getElementById('formulaCalcVars')
    const resultEl = document.getElementById('formulaCalcResult')
    const nameEl = document.getElementById('formulaCalcName')
    const clearBtn = document.getElementById('formulaCalcClear')

    if (!exprInput) return
    const expr = exprInput.value.trim()
    formulaCalcExpr = expr

    renderMathPreview(expr)
    updateErrorDisplay(null)
    if (clearBtn && expr) {
      clearBtn.classList.add('visible')
      nameEl?.classList.add('visible')
    } else {
      clearBtn?.classList.remove('visible')
      if (!expr) nameEl?.classList.remove('visible')
    }

    if (!expr) {
      varsContainer.innerHTML = ''
      resultEl.textContent = '—'
      if (!formulaCalcCurrentId) nameEl.textContent = 'Ingresa o selecciona una fórmula'
      return
    }

    const vars = detectVariables(expr)
    const existingInputs = {}
    varsContainer.querySelectorAll('.formula-smart-var-input').forEach(inp => {
      existingInputs[inp.dataset.var] = inp.value
    })

    if (vars.length > 0) {
      varsContainer.innerHTML = vars.map(v => {
        const val = existingInputs[v] !== undefined ? existingInputs[v] : '0'
        formulaCalcVars[v] = val
        return `<div class="formula-smart-var-chip">
          <span class="formula-smart-var-label">${v}</span>
          <input type="number" class="formula-smart-var-input" data-var="${v}" value="${val}" placeholder="0" step="any">
        </div>`
      }).join('')
    } else {
      varsContainer.innerHTML = ''
    }

    const values = {}
    varsContainer.querySelectorAll('.formula-smart-var-input').forEach(inp => {
      const v = inp.dataset.var
      const val = parseFloat(inp.value)
      values[v] = isNaN(val) ? 0 : val
      formulaCalcVars[v] = inp.value
    })

    const result = evalFormulaExpr(expr, values)
    if (result !== null && isFinite(result)) {
      const formatted = smartFormatNum(result, 8)
      resultEl.textContent = formatted
      animatePop(resultEl)
      updateErrorDisplay(null)
    } else {
      resultEl.textContent = 'Error'
      updateErrorDisplay('La expresión no es válida o contiene errores de sintaxis.')
    }

    // MINI GRAPH REMOVED in v4.0
  }

  function addFormulaHistory (expr, varValues, result) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toLocaleDateString('es-ES')
    const valsStr = Object.entries(varValues).filter(([_, v]) => v !== '' && v !== '0')
      .map(([k, v]) => `${k}=${v}`).join(', ')
    const entry = {
      id: Date.now(),
      type: 'formulas',
      expr, varValues, result,
      time: timeStr, date: dateStr,
      formula: `y = ${expr}  →  ${valsStr ? valsStr + '  →  ' : ''}${result}`
    }
    state.formulaHistory.unshift(entry)
    if (state.formulaHistory.length > 200) state.formulaHistory.length = 200
    persistState()
  }

  function formulaCalcClear () {
    document.getElementById('formulaCalcExpr').value = ''
    document.getElementById('formulaCalcVars').innerHTML = ''
    document.getElementById('formulaCalcResult').textContent = '—'
    document.getElementById('formulaCalcName').textContent = ''
    document.getElementById('formulaCalcClear').classList.remove('visible')
    document.getElementById('formulaCalcName').classList.remove('visible')
    renderMathPreview('')
    updateErrorDisplay(null)
    formulaCalcExpr = ''
    formulaCalcVars = {}
    formulaCalcCurrentId = null
  }

  function loadFormulaToCalc (formula) {
    if (!formula) return
    const exprInput = document.getElementById('formulaCalcExpr')
    exprInput.value = formula.expr
    formulaCalcCurrentId = formula.id
    const nameEl = document.getElementById('formulaCalcName')
    nameEl.textContent = formula.name
    nameEl.classList.add('visible')
    document.getElementById('formulaCalcClear').classList.add('visible')
    formulaCalcUpdate()
    navigateTo('formulas')
    setTimeout(() => {
      const firstInput = document.querySelector('.formula-smart-var-input')
      if (firstInput) firstInput.focus()
    }, 100)
  }

  // ============================
  // FORMULA LIBRARY
  // ============================
  const defaultFormulas = {
    arquitectura: [
      { name: 'Escala 1:100', expr: '(x * 100) / 1', desc: 'Conversión a escala 1:100' },
      { name: 'Pendiente %', expr: '(x / 100) * 100', desc: 'Cálculo de pendiente porcentual' },
      { name: 'Área rectángulo', expr: 'x * x', desc: 'Área = lado × lado' },
      { name: 'Volumen prisma', expr: 'x * x * x', desc: 'Volumen = lado³' }
    ],
    fisica: [
      { name: 'Densidad', expr: 'x / x', desc: 'ρ = m/V' },
      { name: 'Gravedad', expr: 'x * 9.8', desc: 'Peso = m × g' },
      { name: 'Velocidad', expr: 'x / x', desc: 'v = d/t' },
      { name: 'Fuerza', expr: 'x * 9.8', desc: 'F = m × g' }
    ],
    matematica: [
      { name: 'Porcentaje', expr: '(x * x) / 100', desc: 'Porcentaje de un número' },
      { name: 'Raíz cuadrada', expr: 'sqrt(x)', desc: '√x' },
      { name: 'Potencia', expr: 'x^x', desc: 'xⁿ' },
      { name: 'Seno', expr: 'sin(x)', desc: 'sin(x)' }
    ],
    personalizadas: []
  }

  function initFormulas () {
    if (state.formulas.length === 0) {
      for (const cat of state.categories) {
        const defaults = defaultFormulas[cat] || []
        for (const f of defaults) {
          state.formulas.push({ ...f, category: cat, id: Date.now() + Math.random() })
        }
      }
      persistState()
    }
    renderFormulas()
  }

  function renderFormulas (searchTerm) {
    const container = document.getElementById('formulaList')
    if (!container) return
    const cat = state.currentFormulaCategory
    let filtered = state.formulas.filter(f => f.category === cat)
    if (searchTerm) {
      const t = searchTerm.toLowerCase()
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(t) || f.expr.toLowerCase().includes(t) || (f.desc && f.desc.toLowerCase().includes(t))
      )
    }
    if (filtered.length === 0) {
      container.innerHTML = `<div class="formula-empty"><svg viewBox="0 0 24 24" width="36" height="36" opacity="0.3"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg><p>${searchTerm ? 'Sin resultados' : 'Sin fórmulas en esta categoría'}</p></div>`
      return
    }
    container.innerHTML = filtered.map(f => {
      const pinned = state.pinnedFormulas.includes(f.id)
      return `<div class="formula-item">
        <div class="formula-item-header">
          <span class="formula-item-name">${f.name}</span>
          <div class="formula-item-actions">
            <button class="formula-item-action pin" data-id="${f.id}" title="${pinned ? 'Desfijar' : 'Fijar'}">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 11c0 1.66-1.34 3-3 3h-2v5h-2v-5H7v-3h2V6c0-1.66 1.34-3 3-3s3 1.34 3 3v5h2v3h-1z" fill="${pinned ? '#42a5f5' : 'currentColor'}"/></svg>
            </button>
            <button class="formula-item-action use" data-id="${f.id}" title="Usar en calculadora">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
            </button>
            <button class="formula-item-action delete-f" data-id="${f.id}" title="Eliminar">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
        <div class="formula-item-expr">y = ${rawToDisplay(f.expr)}</div>
        ${f.desc ? `<div class="formula-item-desc">${f.desc}</div>` : ''}
      </div>`
    }).join('')
  }

  function deleteFormula (id) {
    state.formulas = state.formulas.filter(f => f.id !== id)
    state.pinnedFormulas = state.pinnedFormulas.filter(p => p !== id)
    persistState()
    renderFormulas()
    showToast('Fórmula eliminada')
  }

  function togglePin (id) {
    const idx = state.pinnedFormulas.indexOf(id)
    if (idx > -1) state.pinnedFormulas.splice(idx, 1)
    else state.pinnedFormulas.push(id)
    persistState()
    renderFormulas()
  }

  // ============================
  // SCIENTIFIC CALCULATOR
  // ============================
  let sciExpr = ''
  let sciResult = '0'

  function rawToDisplay (raw) {
    if (!raw) return '0'
    return raw
      .replace(/Math\.sqrt\(/g, '√(')
      .replace(/Math\.sin\(/g, 'sin(')
      .replace(/Math\.cos\(/g, 'cos(')
      .replace(/Math\.tan\(/g, 'tan(')
      .replace(/Math\.log10\(/g, 'log(')
      .replace(/Math\.log\(/g, 'ln(')
      .replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, '$1^$2')
      .replace(/Math\.PI/g, 'π')
      .replace(/Math\.E/g, 'e')
      .replace(/Math\.abs\(/g, '|')
      .replace(/Math\.floor\(/g, '⌊')
      .replace(/Math\.ceil\(/g, '⌈')
      .replace(/\^2/g, '²')
  }

  function sciInput (action) {
    const expEl = document.getElementById('sciExpression')
    const resEl = document.getElementById('sciResult')
    if (action === 'clear') {
      sciExpr = ''; sciResult = '0'
      expEl.textContent = '0'; resEl.textContent = '0'
      return
    }
    if (action === 'backspace') {
      sciExpr = sciExpr.slice(0, -1)
      expEl.textContent = rawToDisplay(sciExpr)
      return
    }
    if (action === 'calculate') {
      try {
        const result = evalScientific(sciExpr)
        if (result !== null && isFinite(result)) {
          sciResult = smartFormatNum(result, 8)
          resEl.textContent = sciResult
          addSciHistory(sciExpr, sciResult)
          animatePop(resEl)
        } else {
          resEl.textContent = 'Error'
        }
      } catch (e) { resEl.textContent = 'Error' }
      return
    }

    const fnMap = {
      sin: 'Math.sin(', cos: 'Math.cos(', tan: 'Math.tan(',
      log: 'Math.log10(', ln: 'Math.log(', sqrt: 'Math.sqrt(',
      sqr: '^2', pow: '^', pi: 'Math.PI', inv: '1/(',
      perc: '/100', g: '9.8', densidad: '/',
      'paren-left': '(', 'paren-right': ')'
    }
    if (fnMap[action]) {
      sciExpr += fnMap[action]
      expEl.textContent = rawToDisplay(sciExpr)
      return
    }

    sciExpr += action
    expEl.textContent = rawToDisplay(sciExpr)
  }

  function animatePop (el) {
    if (!el || state.animations === false) return
    el.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
    el.style.transform = 'scale(0.96)'
    requestAnimationFrame(() => {
      el.style.transform = 'scale(1)'
    })
  }

  function evalScientific (expr) {
    let sanitized = expr
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**')
    if (!/^[\d\s+\-*/().,%a-zA-Z]+$/.test(sanitized)) return null
    let open = (sanitized.match(/\(/g) || []).length
    let close = (sanitized.match(/\)/g) || []).length
    while (close < open) { sanitized += ')'; close++ }
    try { return Function('"use strict"; return (' + sanitized + ')')() }
    catch (e) { return null }
  }

  function addSciHistory (expr, result) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toLocaleDateString('es-ES')
    const displayResult = smartFormatNum(parseFloat(result), 8) || result
    const entry = {
      id: Date.now(),
      type: 'cientifica',
      expr, result: displayResult,
      time: timeStr, date: dateStr,
      formula: `${rawToDisplay(expr)} = ${displayResult}`
    }
    state.sciHistory.unshift(entry)
    if (state.sciHistory.length > 200) state.sciHistory.length = 200
    persistState()
  }

  // GRAPHING — REMOVED in v4.0

  // ============================
  // HISTORY
  // ============================
  let currentHistoryType = 'escalas'

  function getHistoryByType (type) {
    switch (type) {
      case 'escalas': return state.scaleHistory
      case 'formulas': return state.formulaHistory
      case 'cientifica': return state.sciHistory
      default: return []
    }
  }

  function renderHistory (searchTerm) {
    const container = document.getElementById('historyGrouped')
    const empty = document.getElementById('historyEmpty')
    if (!container) return

    let items = getHistoryByType(currentHistoryType)
    if (searchTerm) {
      const t = searchTerm.toLowerCase()
      items = items.filter(h => h.formula.toLowerCase().includes(t))
    }

    if (items.length === 0) {
      container.innerHTML = ''
      empty.style.display = 'flex'
      return
    }
    empty.style.display = 'none'

    container.innerHTML = items.map(item => {
      const typeIcons = { escalas: '📐', formulas: '📊', cientifica: '🔬' }
      const icon = typeIcons[item.type] || ''
      return `<div class="history-item">
        <div class="history-item-info">
          <div class="history-item-detail">
            <span class="history-item-result">${icon} ${item.result}</span>
            <span class="history-item-time">${item.date} ${item.time}</span>
          </div>
          <div class="history-item-formula">${item.formula}</div>
        </div>
        <div class="history-item-actions">
          <button class="history-item-copy" data-id="${item.id}" data-type="${currentHistoryType}" title="Copiar">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
          </button>
          <button class="history-item-delete" data-id="${item.id}" data-type="${currentHistoryType}" title="Eliminar">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>`
    }).join('')
  }

  function switchHistoryTab (type) {
    currentHistoryType = type
    document.querySelectorAll('.history-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.htype === type)
    })
    const searchVal = document.getElementById('historySearchInput')?.value || ''
    renderHistory(searchVal)
  }

  // ============================
  // COMMAND PALETTE
  // ============================
  let cmdOpen = false

  function toggleCmd () {
    cmdOpen = !cmdOpen
    document.getElementById('cmdPalette').classList.toggle('open', cmdOpen)
    if (cmdOpen) {
      document.getElementById('cmdInput').value = ''
      document.getElementById('cmdInput').focus()
      updateCmdResults('')
    }
  }

  function openCmd () {
    cmdOpen = true
    document.getElementById('cmdPalette').classList.add('open')
    document.getElementById('cmdInput').value = ''
    document.getElementById('cmdInput').focus()
    updateCmdResults('')
  }

  function closeCmd () {
    cmdOpen = false
    document.getElementById('cmdPalette').classList.remove('open')
  }

  function updateCmdResults (query) {
    const t = query.toLowerCase().trim()
    const group = document.getElementById('cmdFormulasGroup')
    const formulas = t
      ? state.formulas.filter(f => f.name.toLowerCase().includes(t) || f.expr.toLowerCase().includes(t))
      : []
    if (formulas.length > 0) {
      group.style.display = 'block'
      let html = '<div class="cmd-group-title">Fórmulas</div>'
      html += formulas.slice(0, 8).map(f => `
        <button class="cmd-item" data-action="formula" data-value="${f.id}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
          <span>${f.name} — ${f.expr}</span>
        </button>
      `).join('')
      group.innerHTML = html
    } else {
      group.style.display = 'none'
    }

    const quickResult = document.getElementById('cmdQuickCalcResult')
    if (t && /[\d+\-*/().]/.test(t)) {
      try {
        const s = t.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**')
        if (/^[\d\s+\-*/().%]+$/.test(s)) {
          const r = Function('"use strict"; return (' + s + ')')()
          if (isFinite(r)) quickResult.textContent = formatNumber(roundValue(r, 4), 4)
          else quickResult.textContent = '—'
        } else { quickResult.textContent = '—' }
      } catch (e) { quickResult.textContent = '—' }
    } else { quickResult.textContent = '—' }
  }

  // ============================
  // SETTINGS
  // ============================
  function applyAccentColor (color) {
    state.accentColor = color
    const hex = accentMap[color] || '#42a5f5'
    document.documentElement.style.setProperty('--accent', hex)
    document.documentElement.style.setProperty('--accent-light', hex)
    document.documentElement.style.setProperty('--accent-glow', hex + '30')
    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color)
    })
    persistState()
  }

  // HELPERS REMOVED in v4.0
  // DASHBOARD MINI GRAPH — REMOVED in v4.0
  let quickScaleTimeout
  function triggerQuickScale () {
    clearTimeout(quickScaleTimeout)
    quickScaleTimeout = setTimeout(() => {
      const res = calculateScale()
      if (res) addScaleHistory(res.x, res.mult, res.div, res.result)
    }, 350)
  }

  // DASHBOARD MINI GRAPH — REMOVED in v4.0

  // ============================
  // ACTION MODAL (Prompt / Confirm)
  // ============================
  function showActionModal (title, opts) {
    return new Promise(function (resolve) {
      var modal = document.getElementById('actionModal')
      var titleEl = document.getElementById('actionModalTitle')
      var msgEl = document.getElementById('actionModalMessage')
      var inputWrap = document.getElementById('actionModalInputWrap')
      var inputLabel = document.getElementById('actionModalInputLabel')
      var input = document.getElementById('actionModalInput')
      var confirmBtn = document.getElementById('actionModalConfirm')
      var cancelBtn = document.getElementById('actionModalCancel')
      var closeBtn = document.getElementById('actionModalClose')
      if (!modal || !titleEl || !confirmBtn || !cancelBtn) { resolve(null); return }

      titleEl.textContent = title || 'Acción'

      if (opts && opts.message) {
        msgEl.style.display = 'block'
        msgEl.textContent = opts.message
      } else {
        msgEl.style.display = 'none'
      }

      var isPrompt = opts && opts.inputLabel !== undefined
      if (isPrompt) {
        inputWrap.style.display = 'block'
        inputLabel.textContent = opts.inputLabel || ''
        input.value = opts.value || ''
        input.placeholder = opts.placeholder || ''
        setTimeout(function () { input.focus(); input.select() }, 100)
      } else {
        inputWrap.style.display = 'none'
      }

      confirmBtn.textContent = (opts && opts.confirmText) || 'Aceptar'
      cancelBtn.textContent = (opts && opts.cancelText) || 'Cancelar'

      function onKeydown (e) {
        if (e.key === 'Enter' && isPrompt) { e.preventDefault(); onConfirm() }
        if (e.key === 'Escape') { onCancel() }
      }

      function onOverlay (e) {
        if (e.target === modal) onCancel()
      }

      function cleanup () {
        modal.classList.remove('open')
        modal.removeEventListener('click', onOverlay)
        confirmBtn.removeEventListener('click', onConfirm)
        cancelBtn.removeEventListener('click', onCancel)
        closeBtn.removeEventListener('click', onCancel)
        if (input) input.removeEventListener('keydown', onKeydown)
      }

      function onConfirm () {
        cleanup()
        resolve(isPrompt ? input.value : true)
      }

      function onCancel () {
        cleanup()
        resolve(isPrompt ? null : false)
      }

      modal.addEventListener('click', onOverlay)
      confirmBtn.addEventListener('click', onConfirm)
      cancelBtn.addEventListener('click', onCancel)
      closeBtn.addEventListener('click', onCancel)
      if (input) input.addEventListener('keydown', onKeydown)
      modal.classList.add('open')
    })
  }

  function showConfirm (title, message) {
    return showActionModal(title, { message: message || '' })
  }

  // ============================
  // INIT
  // ============================
  function init () {
    loadState()

    // Sidebar nav
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.section))
    })

    // Bottom nav
    document.querySelectorAll('.bnav-item').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.section))
    })

    // Menu toggle
    document.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        document.getElementById('sidebar').classList.toggle('open')
      })
    })

    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar')
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !e.target.closest('.menu-btn')) {
        sidebar.classList.remove('open')
      }
    })

    // Sidebar cmd button
    document.getElementById('cmdPaletteBtn')?.addEventListener('click', openCmd)
    document.getElementById('dashCmdBtn')?.addEventListener('click', openCmd)

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); cmdOpen ? closeCmd() : openCmd(); return }
      if (e.key === 'Escape' && cmdOpen) { closeCmd(); return }
      if (e.key === 'Escape') {
        const modal = document.getElementById('formulaModal')
        if (modal && modal.classList.contains('open')) modal.classList.remove('open')
      }
    })

    // ===== SCALE CALCULATOR =====
    const doc = document
    const calcInput = doc.getElementById('calcInput')
    const divInput = doc.getElementById('divisorInput')
    const fromScaleInput = doc.getElementById('fromScaleInput')
    const scaleModeSelect = doc.getElementById('scaleModeSelect')
    if (calcInput) calcInput.addEventListener('input', triggerScaleCalc)
    if (divInput) divInput.addEventListener('input', triggerScaleCalc)
    if (fromScaleInput) fromScaleInput.addEventListener('input', triggerScaleCalc)
    if (scaleModeSelect) scaleModeSelect.addEventListener('change', triggerScaleCalc)

    // Scale presets
    document.querySelectorAll('.preset-chip.scale-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        applyScalePreset(parseFloat(btn.dataset.scale))
      })
    })

    // Scale mode toggle
    document.getElementById('scaleModeSelect')?.addEventListener('change', function () {
      const field = document.getElementById('fromScaleField')
      if (field) field.style.display = this.value === 'scale-to-scale' ? 'block' : 'none'
    })

    // Divisor presets (simple value chips)
    document.querySelectorAll('.preset-chip[data-value]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-chip[data-value]').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        if (btn.dataset.value === 'custom') { document.getElementById('divisorInput').focus(); return }
        document.getElementById('divisorInput').value = btn.dataset.value
        triggerScaleCalc()
      })
    })

    // Rounding
    document.querySelectorAll('.rounding-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rounding-chip').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        state.rounding = parseInt(btn.dataset.round) || 2
        persistState()
        calculateScale()
      })
    })

    // Copy result
    document.getElementById('copyResult')?.addEventListener('click', () => {
      const val = document.getElementById('resultValue').textContent
      if (val && val !== '—') navigator.clipboard.writeText(val).then(() => showToast('Copiado: ' + val))
    })

    // ===== SMART FORMULA CALCULATOR =====
    const formulaCalcExprInput = document.getElementById('formulaCalcExpr')
    if (formulaCalcExprInput) {
      formulaCalcExprInput.addEventListener('input', formulaCalcUpdate)
      formulaCalcExprInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          formulaCalcUpdate()
          const expr = formulaCalcExprInput.value.trim()
          const result = document.getElementById('formulaCalcResult').textContent
          if (expr && result && result !== '—' && result !== 'Error') {
            addFormulaHistory(expr, { ...formulaCalcVars }, result)
            showToast('Resultado guardado en historial')
          }
        }
      })
    }

    // Formula calc clear
    document.getElementById('formulaCalcClear')?.addEventListener('click', formulaCalcClear)

    // Formula calc copy
    document.getElementById('formulaCalcCopy')?.addEventListener('click', () => {
      const val = document.getElementById('formulaCalcResult').textContent
      if (val && val !== '—') navigator.clipboard.writeText(val).then(() => showToast('Copiado: ' + val))
    })

    // Live variable input changes
    document.getElementById('formulaCalcVars')?.addEventListener('input', (e) => {
      const input = e.target.closest('.formula-smart-var-input')
      if (input) formulaCalcUpdate()
    })

    // Toggle formula library visibility
    document.getElementById('toggleFormulaLib')?.addEventListener('click', () => {
      const grid = document.getElementById('formulaList')
      const addBtn = document.querySelector('.add-formula-btn')
      const catBar = document.getElementById('formulaCategories')
      const searchBar = document.getElementById('formulaSearchBar')
      const isHidden = grid.style.display === 'none'
      grid.style.display = isHidden ? '' : 'none'
      addBtn.style.display = isHidden ? '' : 'none'
      catBar.style.display = isHidden ? '' : 'none'
      searchBar.style.display = isHidden ? '' : 'none'
    })

    // ===== FORMULA LIBRARY =====
    document.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        state.currentFormulaCategory = btn.dataset.category
        renderFormulas(document.getElementById('formulaSearchInput').value)
      })
    })

    // Fav filter toggle
    document.getElementById('favFilterToggle')?.classList.toggle('active', !!state.favFilterActive)
    document.getElementById('favFilterToggle')?.addEventListener('click', () => {
      state.favFilterActive = !state.favFilterActive
      document.getElementById('favFilterToggle').classList.toggle('active', !!state.favFilterActive)
      const cat = state.currentFormulaCategory
      if (state.favFilterActive) {
        const container = document.getElementById('formulaList')
        const filtered = state.formulas.filter(f => f.category === cat && state.pinnedFormulas.includes(f.id))
        if (filtered.length === 0) {
          container.innerHTML = '<div class="formula-empty"><svg viewBox="0 0 24 24" width="36" height="36" opacity="0.3"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg><p>Sin fórmulas favoritas</p></div>'
        } else {
          container.innerHTML = filtered.map(f => {
            return `<div class="formula-item">
              <div class="formula-item-header">
                <span class="formula-item-name">${f.name}</span>
                <div class="formula-item-actions">
                  <button class="formula-item-action pin" data-id="${f.id}" title="Desfijar">
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 11c0 1.66-1.34 3-3 3h-2v5h-2v-5H7v-3h2V6c0-1.66 1.34-3 3-3s3 1.34 3 3v5h2v3h-1z" fill="#42a5f5"/></svg>
                  </button>
                  <button class="formula-item-action use" data-id="${f.id}" title="Usar en calculadora">
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                  </button>
                  <button class="formula-item-action delete-f" data-id="${f.id}" title="Eliminar">
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                  </button>
                </div>
              </div>
              <div class="formula-item-expr">y = ${rawToDisplay(f.expr)}</div>
              ${f.desc ? `<div class="formula-item-desc">${f.desc}</div>` : ''}
            </div>`
          }).join('')
        }
      } else {
        renderFormulas(document.getElementById('formulaSearchInput').value)
      }
      persistState()
      showToast(state.favFilterActive ? 'Mostrando solo favoritas' : 'Mostrando todas')
    })

    document.getElementById('formulaList')?.addEventListener('click', (e) => {
      const useBtn = e.target.closest('.use')
      const delBtn = e.target.closest('.delete-f')
      const pinBtn = e.target.closest('.pin')
      if (useBtn) {
        const id = parseFloat(useBtn.dataset.id)
        const f = state.formulas.find(f => f.id === id)
        if (f) loadFormulaToCalc(f)
      }
      if (delBtn) deleteFormula(parseFloat(delBtn.dataset.id))
      if (pinBtn) togglePin(parseFloat(pinBtn.dataset.id))
    })

    // Formula search
    document.getElementById('searchFormulaToggle')?.addEventListener('click', () => {
      const bar = document.getElementById('formulaSearchBar')
      bar.classList.toggle('visible')
      if (bar.classList.contains('visible')) document.getElementById('formulaSearchInput').focus()
    })

    document.getElementById('formulaSearchInput')?.addEventListener('input', (e) => {
      renderFormulas(e.target.value)
    })

    // Add formula
    document.getElementById('addFormulaBtn')?.addEventListener('click', () => {
      document.getElementById('formulaModal').classList.add('open')
      document.getElementById('formulaName').value = ''
      document.getElementById('formulaExpression').value = ''
      document.getElementById('formulaDesc').value = ''
      document.getElementById('formulaCategory').value = state.currentFormulaCategory
    })

    // Modal
    document.getElementById('modalClose')?.addEventListener('click', () => document.getElementById('formulaModal').classList.remove('open'))
    document.getElementById('modalCancel')?.addEventListener('click', () => document.getElementById('formulaModal').classList.remove('open'))
    document.getElementById('modalSave')?.addEventListener('click', () => {
      const name = document.getElementById('formulaName').value.trim()
      const expr = document.getElementById('formulaExpression').value.trim()
      const desc = document.getElementById('formulaDesc').value.trim()
      const cat = document.getElementById('formulaCategory').value
      if (!name) { showToast('El nombre es requerido'); return }
      if (!expr) { showToast('La expresión es requerida'); return }

      // Validate expression is parseable
      const vars = detectVariables(expr)
      const testValues = {}
      vars.forEach(function(v) { testValues[v] = 1 })
      const testResult = evalFormulaExpr(expr, testValues)
      if (testResult === null || !isFinite(testResult)) {
        showToast('La expresión no es válida. Revisa la sintaxis.')
        return
      }

      state.formulas.push({ id: Date.now() + Math.random(), name, expr, desc, category: cat })
      persistState(); renderFormulas()
      document.getElementById('formulaModal').classList.remove('open')
      showToast('Fórmula guardada')
    })

    // Formula expression input var preview
    document.getElementById('formulaExpression')?.addEventListener('input', (e) => {
      const vars = detectVariables(e.target.value)
      const preview = document.getElementById('formulaVarsPreview')
      const chips = document.getElementById('varsPreviewChips')
      if (vars.length > 0) {
        preview.style.display = 'block'
        chips.innerHTML = vars.map(v => `<span class="formula-smart-var-chip" style="display:inline-flex;margin:2px"><span class="formula-smart-var-label">${v}</span></span>`).join('')
      } else {
        preview.style.display = 'none'
      }
    })

    // ===== SCIENTIFIC CALCULATOR =====
    document.querySelectorAll('.sci-key').forEach(btn => {
      btn.addEventListener('click', () => sciInput(btn.dataset.action))
    })

    // GRAPH EVENT HANDLERS — REMOVED in v4.0

    // ===== HISTORY =====
    document.querySelectorAll('.history-tab').forEach(tab => {
      tab.addEventListener('click', () => switchHistoryTab(tab.dataset.htype))
    })

    document.getElementById('historySearchInput')?.addEventListener('input', (e) => {
      renderHistory(e.target.value)
    })

    document.getElementById('historySearchBtn')?.addEventListener('click', () => {
      const controls = document.getElementById('historyControls')
      controls.style.display = controls.style.display === 'none' ? 'flex' : 'none'
      if (controls.style.display === 'flex') {
        document.getElementById('historySearchInput').focus()
      }
    })

    document.getElementById('copyAllHistory')?.addEventListener('click', () => {
      const items = getHistoryByType(currentHistoryType)
      if (items.length === 0) { showToast('Sin historial'); return }
      navigator.clipboard.writeText(items.map(h => h.formula).join('\n')).then(() => showToast('Historial copiado'))
    })

    document.getElementById('deleteAllHistory')?.addEventListener('click', () => {
      const items = getHistoryByType(currentHistoryType)
      if (items.length === 0) { showToast('Sin historial'); return }
      showConfirm('Eliminar historial', '¿Eliminar todo el historial de ' + currentHistoryType + '? Esta acción no se puede deshacer.').then(function(confirmed) {
        if (!confirmed) return
        const type = currentHistoryType
        if (type === 'escalas') state.scaleHistory = []
        else if (type === 'formulas') state.formulaHistory = []
        else if (type === 'cientifica') state.sciHistory = []
        else if (type === 'proyectos') { state.scaleHistory = []; state.formulaHistory = []; state.sciHistory = [] }
        persistState(); renderHistory(); showToast('Historial eliminado')
      })
    })

    document.getElementById('historyGrouped')?.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.history-item-copy')
      if (copyBtn) {
        const items = getHistoryByType(copyBtn.dataset.type)
        const item = items.find(h => h.id === parseFloat(copyBtn.dataset.id))
        if (item) navigator.clipboard.writeText(item.formula).then(() => showToast('Copiado'))
        return
      }
      const delBtn = e.target.closest('.history-item-delete')
      if (delBtn) {
        const type = delBtn.dataset.type
        const id = parseFloat(delBtn.dataset.id)
        let arr = getHistoryByType(type)
        const idx = arr.findIndex(h => h.id === id)
        if (idx !== -1) {
          arr.splice(idx, 1)
          persistState()
          const searchVal = document.getElementById('historySearchInput')?.value || ''
          renderHistory(searchVal)
          showToast('Elemento eliminado')
        }
      }
    })

    // ===== SETTINGS =====
    document.getElementById('settingDecimals')?.addEventListener('change', (e) => {
      state.rounding = parseInt(e.target.value) || 2
      document.querySelectorAll('.rounding-chip').forEach(b => b.classList.toggle('active', parseInt(b.dataset.round) === state.rounding))
      persistState()
      calculateScale()
    })

    document.getElementById('settingAnimations')?.addEventListener('change', (e) => {
      state.animations = e.target.checked
      document.querySelector('.content').style.transition = state.animations ? '' : 'none'
      persistState()
    })

    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        applyAccentColor(btn.dataset.color)
      })
    })

    document.getElementById('clearAllData')?.addEventListener('click', () => {
      showConfirm('Borrar todos los datos', '¿Borrar todos los datos? Esta acción no se puede deshacer.').then(function(confirmed) {
        if (!confirmed) return
        state.scaleHistory = []; state.formulaHistory = []; state.sciHistory = []
        state.formulas = []; state.pinnedFormulas = []
        persistState(); renderHistory(); initFormulas(); updateDashboard()
        showToast('Todos los datos eliminados')
      })
    })

    document.getElementById('exportFormulas')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.formulas, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'arc-formulas.json'
      a.click(); URL.revokeObjectURL(a.href)
      showToast('Fórmulas exportadas')
    })

    document.getElementById('importFormulas')?.addEventListener('click', () => {
      document.getElementById('importFile').click()
    })

    document.getElementById('importFile')?.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result)
          if (Array.isArray(imported)) {
            for (const f of imported) {
              if (f.name && f.expr && f.category) state.formulas.push({ ...f, id: Date.now() + Math.random() })
            }
            persistState(); renderFormulas(); showToast('Fórmulas importadas')
          }
        } catch (err) { showToast('Error al importar') }
      }
      reader.readAsText(file)
      e.target.value = ''
    })

    // ===== COMMAND PALETTE =====
    document.getElementById('cmdPalette')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeCmd()
    })

    document.getElementById('cmdInput')?.addEventListener('input', (e) => {
      updateCmdResults(e.target.value)
    })

    document.getElementById('cmdInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeCmd(); return }
      if (e.key === 'Enter') {
        const first = document.querySelector('.cmd-item:not([style*="display: none"])')
        if (first) { first.click(); closeCmd() }
      }
    })

    document.getElementById('cmdResults')?.addEventListener('click', (e) => {
      const item = e.target.closest('.cmd-item')
      if (!item) return
      const action = item.dataset.action
      const value = item.dataset.value
      if (action === 'nav') { closeCmd(); navigateTo(value) }
      if (action === 'formula') {
        closeCmd()
        const f = state.formulas.find(f => f.id === parseFloat(value))
        if (f) loadFormulaToCalc(f)
      }
    })

    // ===== DASHBOARD =====
    document.querySelectorAll('.dash-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action
        if (action === 'nueva-formula') {
          document.getElementById('formulaModal').classList.add('open')
          document.getElementById('formulaName').value = ''
          document.getElementById('formulaExpression').value = ''
          document.getElementById('formulaDesc').value = ''
        } else {
          navigateTo(action)
        }
      })
    })

    document.querySelectorAll('.dash-see-all').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.section))
    })

    document.querySelectorAll('.dash-category-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateTo('formulas')
        document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'))
        const target = document.querySelector(`.category-pill[data-category="${btn.dataset.category}"]`)
        if (target) {
          target.classList.add('active')
          state.currentFormulaCategory = btn.dataset.category
          renderFormulas()
        }
      })
    })

    document.getElementById('dashPinnedList')?.addEventListener('click', (e) => {
      const item = e.target.closest('.dash-pinned-item')
      if (item) {
        const id = parseFloat(item.dataset.id)
        const f = state.formulas.find(f => f.id === id)
        if (f) loadFormulaToCalc(f)
      }
    })

    // ===== PWA INSTALL PROMPT =====
    let deferredPrompt = null
    let isInstalled = false

    // Check if already installed (display-mode: standalone)
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      isInstalled = true
    }

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      updateInstallButton()
    })

    // Handle app install
    window.addEventListener('appinstalled', () => {
      isInstalled = true
      deferredPrompt = null
      hideInstallButton()
      showToast('ARC instalada correctamente')
    })

    function updateInstallButton () {
      const btn = document.getElementById('installBtn')
      const settingsBtn = document.getElementById('settingsInstallBtn')
      if (!btn) return
      if (deferredPrompt && !isInstalled) {
        btn.style.display = 'flex'
        if (settingsBtn) settingsBtn.textContent = 'Instalar'
      } else {
        hideInstallButton()
      }
    }

    function hideInstallButton () {
      const btn = document.getElementById('installBtn')
      if (btn) btn.style.display = 'none'
      const settingsBtn = document.getElementById('settingsInstallBtn')
      if (settingsBtn) settingsBtn.textContent = 'Instalada'
    }

    function triggerInstall () {
      if (!deferredPrompt) {
        // If no deferred prompt (iOS or already installed), show install modal
        if (isIOS() && !isInstalled) {
          document.getElementById('installModal').classList.add('open')
        } else if (!isInstalled) {
          showToast('ARC ya está instalada o no disponible para instalar')
        }
        return
      }
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          isInstalled = true
          hideInstallButton()
        }
        deferredPrompt = null
      })
    }

    // Floating install button
    document.getElementById('installBtn')?.addEventListener('click', triggerInstall)

    // Settings install button
    document.getElementById('settingsInstallBtn')?.addEventListener('click', (e) => {
      e.preventDefault()
      triggerInstall()
    })

    // Install modal close
    document.getElementById('installModalClose')?.addEventListener('click', () => {
      document.getElementById('installModal').classList.remove('open')
    })

    // Close install modal on overlay click
    document.getElementById('installModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.getElementById('installModal').classList.remove('open')
      }
    })

    function isIOS () {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    }

    // Show install modal automatically for iOS users after 2s if not installed
    if (isIOS() && !isInstalled) {
      setTimeout(() => {
        if (!isInstalled && !deferredPrompt) {
          // Don't auto-show, just update button
        }
      }, 3000)
    }

    // ===== OFFLINE / ONLINE DETECTION =====
    function updateOnlineStatus () {
      const indicator = document.getElementById('offlineIndicator')
      const statusValue = document.getElementById('appStatusValue')
      if (!navigator.onLine) {
        if (indicator) indicator.style.display = 'flex'
        if (statusValue) {
          statusValue.textContent = 'Sin conexión'
          statusValue.style.color = 'var(--danger)'
        }
      } else {
        if (indicator) indicator.style.display = 'none'
        if (statusValue) {
          statusValue.textContent = 'En línea'
          statusValue.style.color = 'var(--accent-light)'
        }
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()

    // ===== APP VERSION =====
    document.getElementById('appVersionValue').textContent = state.version || '4.0.0'

    // ===== CLEAR CACHE =====
    document.getElementById('clearCacheBtn')?.addEventListener('click', () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
      }
      // Also clear localStorage backup
      showToast('Cache limpiada')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    })

    // Listen for SW messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'CACHE_CLEARED') {
          showToast('Cache eliminada correctamente')
        }
        if (e.data?.type === 'SW_VERSION') {
          console.log('SW version:', e.data.version)
        }
      })
    }

    // ===== APPLY SETTINGS =====
    applyAccentColor(state.accentColor)

    document.querySelectorAll('.rounding-chip').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.round) === state.rounding)
    })

    // ===== INIT =====
    navigateTo(state.currentSection)
    switchHistoryTab('escalas')
    initFormulas()
    if (state.favFilterActive) {
      document.getElementById('favFilterToggle')?.classList.add('active')
      var cat = state.currentFormulaCategory
      var filtered = state.formulas.filter(function(f) { return f.category === cat && state.pinnedFormulas.includes(f.id); })
      if (filtered.length === 0) {
        var container = document.getElementById('formulaList')
        if (container) container.innerHTML = '<div class="formula-empty"><svg viewBox="0 0 24 24" width="36" height="36" opacity="0.3"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg><p>Sin fórmulas favoritas</p></div>'
      } else {
        renderFormulas(document.getElementById('formulaSearchInput') ? document.getElementById('formulaSearchInput').value : '')
      }
    }
    calculateScale()

    // Register SW with update handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then((registration) => {
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showToast('Nueva versión disponible. Actualizando...')
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              setTimeout(() => window.location.reload(), 1000)
            }
          })
        })
      }).catch(() => {})

      // Reload on controller change
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    }
  }

  // ============================
  // SCALE VALIDATION (v4.0)
  // ============================
  function runScaleValidation () {
    var errors = []
    var testRealToScale = function (real, scale, expected) {
      var result = real / scale
      if (Math.abs(result - expected) > 0.0001) errors.push('Real→Esc: ' + real + 'cm @1:' + scale + ' = ' + result + ' (expected ' + expected + ')')
    }
    var testScaleToScale = function (val, fromS, toS, expected) {
      var result = val * fromS / toS
      if (Math.abs(result - expected) > 0.0001) errors.push('Esc→Esc: ' + val + 'cm ' + fromS + '→' + toS + ' = ' + result + ' (expected ' + expected + ')')
    }
    testRealToScale(100, 100, 1)
    testRealToScale(100, 50, 2)
    testRealToScale(100, 20, 5)
    testRealToScale(100, 10, 10)
    testRealToScale(200, 100, 2)
    testRealToScale(1000, 100, 10)
    testRealToScale(500, 50, 10)
    testScaleToScale(1, 100, 50, 2)
    testScaleToScale(2, 50, 100, 1)
    testScaleToScale(5, 20, 100, 1)
    testScaleToScale(0.5, 200, 100, 1)
    if (errors.length > 0) {
      console.warn('[ARC v4.0] Scale validation FAILED:', errors)
    } else {
      console.log('[ARC v4.0] Scale validation PASSED')
    }
    return errors
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  runScaleValidation()
})()