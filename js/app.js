;(function () {
  'use strict'

  // ============================
  // STATE
  // ============================
  const state = {
    currentSection: 'dashboard',
    calcMultiplier: 1,
    calcDivisor: 1,
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
    version: '3.0.0'
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
      delete s.sciHistory; delete s.pinnedFormulas
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

  function formatNumber (value, decimals) {
    if (decimals === 0) return String(value)
    return value.toFixed(decimals)
  }

  function smartFormatNum (value, maxDec) {
    if (value === undefined || value === null || !isFinite(value)) return '—'
    if (maxDec === 0) return String(Math.round(value))
    var rounded = roundValue(value, maxDec)
    var str = rounded.toFixed(maxDec)
    str = str.replace(/\.?0+$/, '')
    return str
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
    document.getElementById('dashCalcCount').textContent = todayCount
    document.getElementById('dashFormulaCount').textContent = state.formulas.length
    document.getElementById('dashFavCount').textContent = state.pinnedFormulas.length

    // Recent calcs (from all histories)
    const recentList = document.getElementById('dashRecentList')
    const recent = allHistory.slice().sort((a, b) => b.id - a.id).slice(0, 5)
    if (recent.length === 0) {
      recentList.innerHTML = '<div class="dash-empty"><p>Aún no hay cálculos</p></div>'
    } else {
      recentList.innerHTML = recent.map(h => {
        const typeLabel = { escalas: '📐', formulas: '📊', cientifica: '🔬' }[h.type] || ''
        return `<div class="dash-recent-item">
          <span class="dash-recent-item-result">${h.result}</span>
          <div class="dash-recent-item-info">${typeLabel} ${h.date} ${h.time}<br>${h.formula}</div>
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
  // SCALE CALCULATOR
  // ============================
  function calculateScale () {
    const x = parseFloat(document.getElementById('calcInput').value)
    const mult = parseFloat(document.getElementById('multiplierInput').value) || state.calcMultiplier
    const div = parseFloat(document.getElementById('divisorInput').value) || state.calcDivisor
    const rounding = state.rounding
    state.calcMultiplier = mult
    state.calcDivisor = div

    if (isNaN(x) || isNaN(mult) || isNaN(div) || div === 0) {
      document.getElementById('resultValue').textContent = '—'
      document.getElementById('calcDisplay').textContent = '0'
      return null
    }

    const result = (x * mult) / div
    const rounded = roundValue(result, rounding)
    const formatted = formatNumber(rounded, rounding)
    document.getElementById('calcDisplay').textContent = formatted
    document.getElementById('resultValue').textContent = formatted
    document.getElementById('calcFormulaLabel').textContent = `x · ${formatNumber(mult, 4)} ÷ ${formatNumber(div, 4)}`

    const display = document.getElementById('calcDisplay')
    display.style.transition = 'none'
    display.style.transform = 'scale(1.03)'
    requestAnimationFrame(() => {
      display.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      display.style.transform = 'scale(1)'
    })

    return { x, mult, div, result: formatted, raw: rounded }
  }

  function addScaleHistory (x, mult, div, result) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toLocaleDateString('es-ES')
    const entry = {
      id: Date.now(),
      type: 'escalas',
      x, mult, div, result,
      time: timeStr, date: dateStr,
      formula: `(${x} × ${mult}) ÷ ${div} = ${result}`
    }
    state.scaleHistory.unshift(entry)
    if (state.scaleHistory.length > 200) state.scaleHistory.length = 200
    linkToActiveProject('scale', entry)
    persistState()
  }

  function applyScalePreset (scale) {
    document.getElementById('multiplierInput').value = '1'
    document.getElementById('divisorInput').value = String(scale)
    document.querySelectorAll('.preset-chip.scale-preset').forEach(b => {
      b.classList.toggle('active', parseFloat(b.dataset.scale) === scale)
    })
    document.querySelectorAll('.preset-chip[data-value]').forEach(b => b.classList.remove('active'))
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
    }, 350)
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

  function formulaCalcUpdate () {
    const exprInput = document.getElementById('formulaCalcExpr')
    const varsContainer = document.getElementById('formulaCalcVars')
    const resultEl = document.getElementById('formulaCalcResult')
    const nameEl = document.getElementById('formulaCalcName')

    if (!exprInput) return
    const expr = exprInput.value.trim()
    formulaCalcExpr = expr

    if (!expr) {
      varsContainer.innerHTML = ''
      resultEl.textContent = '—'
      nameEl.textContent = 'Ingresa o selecciona una fórmula'
      return
    }

    const vars = detectVariables(expr)
    const existingInputs = {}
    varsContainer.querySelectorAll('.formula-calc-var-input').forEach(inp => {
      existingInputs[inp.dataset.var] = inp.value
    })

    if (vars.length > 0) {
      varsContainer.innerHTML = vars.map(v => {
        const val = existingInputs[v] !== undefined ? existingInputs[v] : '0'
        formulaCalcVars[v] = val
        return `<div class="formula-calc-var-chip">
          <span class="formula-calc-var-label">${v}</span>
          <input type="number" class="formula-calc-var-input" data-var="${v}" value="${val}" placeholder="0" step="any">
        </div>`
      }).join('')
    } else {
      varsContainer.innerHTML = ''
    }

    // Collect current values and evaluate
    const values = {}
    varsContainer.querySelectorAll('.formula-calc-var-input').forEach(inp => {
      const v = inp.dataset.var
      const val = parseFloat(inp.value)
      values[v] = isNaN(val) ? 0 : val
      formulaCalcVars[v] = inp.value
    })

    const result = evalFormulaExpr(expr, values)
    if (result !== null && isFinite(result)) {
      const formatted = smartFormatNum(result, 8)
      resultEl.textContent = formatted
      animateFormulaResult(resultEl)
    } else {
      resultEl.textContent = 'Error'
    }
  }

  function animateFormulaResult (el) {
    el.style.transition = 'none'
    el.style.transform = 'scale(1.05)'
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      el.style.transform = 'scale(1)'
    })
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
    linkToActiveProject('formula', entry)
    persistState()
  }

  function formulaCalcClear () {
    document.getElementById('formulaCalcExpr').value = ''
    document.getElementById('formulaCalcVars').innerHTML = ''
    document.getElementById('formulaCalcResult').textContent = '—'
    document.getElementById('formulaCalcName').textContent = 'Ingresa o selecciona una fórmula'
    formulaCalcExpr = ''
    formulaCalcVars = {}
    formulaCalcCurrentId = null
  }

  function loadFormulaToCalc (formula) {
    if (!formula) return
    const exprInput = document.getElementById('formulaCalcExpr')
    exprInput.value = formula.expr
    formulaCalcCurrentId = formula.id
    document.getElementById('formulaCalcName').textContent = formula.name
    formulaCalcUpdate()
    navigateTo('formulas')
    // Focus first var input after render
    setTimeout(() => {
      const firstInput = document.querySelector('.formula-calc-var-input')
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
          animateResult(resEl)
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

  function animateResult (el) {
    el.style.transition = 'none'
    el.style.transform = 'scale(1.05)'
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
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
    linkToActiveProject('sci', entry)
    persistState()
  }

  // ============================
  // GRAPHING
  // ============================
  let graphState = { xMin: -10, xMax: 10, yMin: -10, yMax: 10, expr: '2*x+3', zoom: 1 }
  let isDragging = false
  let dragStartX = 0, dragStartY = 0
  let gsXMin, gsXMax, gsYMin, gsYMax

  function parseExpression (input) {
    let s = input.trim()
    if (s.startsWith('y=')) s = s.substring(2).trim()
    s = s.replace(/\^/g, '**')
    s = s.replace(/(\d)([a-zA-Z])/g, '$1*$2')
    s = s.replace(/([a-zA-Z])(\d)/g, '$1*$2')
    s = s.replace(/(\d)\(/g, '$1*(')
    s = s.replace(/\)\(/g, ')*(')
    s = s.replace(/sqrt\(/g, 'Math.sqrt(')
    s = s.replace(/sin\(/g, 'Math.sin(')
    s = s.replace(/cos\(/g, 'Math.cos(')
    s = s.replace(/tan\(/g, 'Math.tan(')
    s = s.replace(/log\(/g, 'Math.log10(')
    s = s.replace(/ln\(/g, 'Math.log(')
    s = s.replace(/pi/gi, 'Math.PI')
    s = s.replace(/(\d)(x)/g, '$1*$2')
    s = s.replace(/(x)(\d)/g, '$1*$2')
    return s
  }

  function drawGraph () {
    const canvas = document.getElementById('graphCanvas')
    if (!canvas) return
    const rect = canvas.parentElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = rect.width; const h = rect.height
    canvas.width = w * dpr; canvas.height = h * dpr
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const { xMin, xMax, yMin, yMax, expr } = graphState
    const pad = 48
    const plotW = w - pad * 2; const plotH = h - pad * 2
    const xToPixel = x => pad + ((x - xMin) / (xMax - xMin)) * plotW
    const yToPixel = y => pad + ((yMax - y) / (yMax - yMin)) * plotH

    const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2)
    gradient.addColorStop(0, '#0d0d0d')
    gradient.addColorStop(1, '#070707')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    const xStep = Math.pow(10, Math.floor(Math.log10((xMax - xMin) / 5)))
    const yStep = Math.pow(10, Math.floor(Math.log10((yMax - yMin) / 5)))
    for (let x = Math.floor(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const px = xToPixel(x)
      ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, h - pad); ctx.stroke()
    }
    for (let y = Math.floor(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const py = yToPixel(y)
      ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(w - pad, py); ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1.5
    const x0 = xToPixel(0); const y0 = yToPixel(0)
    if (x0 >= pad && x0 <= w - pad) { ctx.beginPath(); ctx.moveTo(x0, pad); ctx.lineTo(x0, h - pad); ctx.stroke() }
    if (y0 >= pad && y0 <= h - pad) { ctx.beginPath(); ctx.moveTo(pad, y0); ctx.lineTo(w - pad, y0); ctx.stroke() }

    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '11px ' + getComputedStyle(document.body).fontFamily
    ctx.textAlign = 'center'
    for (let x = Math.floor(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue
      ctx.fillText(formatNumber(x, x % 1 === 0 ? 0 : 2), xToPixel(x), h - pad + 16)
    }
    ctx.textAlign = 'right'
    for (let y = Math.floor(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue
      ctx.fillText(formatNumber(y, y % 1 === 0 ? 0 : 2), pad - 8, yToPixel(y) + 4)
    }

    if (!expr) return
    try {
      const compiled = new Function('x', '"use strict"; return ' + parseExpression(expr))
      const accent = accentMap[state.accentColor] || '#42a5f5'

      ctx.save()
      ctx.strokeStyle = accent
      ctx.lineWidth = 6
      ctx.shadowColor = accent
      ctx.shadowBlur = 20
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      let started = false
      const steps = Math.max(200, Math.floor(plotW * 1.5))
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin)
        try {
          const y = compiled(x)
          if (isFinite(y) && y > -1000 && y < 1000) {
            const px = xToPixel(x); const py = yToPixel(y)
            if (!started) { ctx.moveTo(px, py); started = true }
            else ctx.lineTo(px, py)
          } else { started = false }
        } catch (e) { started = false }
      }
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.strokeStyle = accent
      ctx.lineWidth = 2.5
      ctx.shadowColor = accent
      ctx.shadowBlur = 8
      ctx.beginPath()
      started = false
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin)
        try {
          const y = compiled(x)
          if (isFinite(y) && y > -1000 && y < 1000) {
            const px = xToPixel(x); const py = yToPixel(y)
            if (!started) { ctx.moveTo(px, py); started = true }
            else ctx.lineTo(px, py)
          } else { started = false }
        } catch (e) { started = false }
      }
      ctx.stroke()
      ctx.restore()
    } catch (e) {}

    document.getElementById('graphZoomLabel').textContent = Math.round(graphState.zoom * 100) + '%'
  }

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
    document.documentElement.style.setProperty('--accent-glow', hex + '40')
    document.documentElement.style.setProperty('--accent-glow-strong', hex + '66')
    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color)
    })
    persistState()
  }

  // ============================
  // HELPERS
  // ============================
  let quickScaleTimeout
  function triggerQuickScale () {
    clearTimeout(quickScaleTimeout)
    quickScaleTimeout = setTimeout(() => {
      const res = calculateScale()
      if (res) addScaleHistory(res.x, res.mult, res.div, res.result)
    }, 350)
  }

  // ============================
  // LINK CALCULATION TO ACTIVE PROJECT
  // ============================
  function linkToActiveProject (type, data) {
    if (!state.activeProjectId || !Array.isArray(state.projects)) return
    var p = state.projects.find(function(p) { return p.id === state.activeProjectId; })
    if (!p) return
    if (!p.calculations) p.calculations = []
    p.calculations.unshift({
      type: type,
      result: data.result || '',
      formula: data.formula || data.expr || '',
      date: new Date().toISOString()
    })
    if (p.calculations.length > 200) p.calculations.length = 200
  }

  // ============================
  // DRAW MINI GRAPH (DASHBOARD)
  // ============================
  function drawMiniGraph () {
    const canvas = document.getElementById('dashMiniCanvas')
    if (!canvas) return
    const rect = canvas.parentElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth || rect.width - 48 || 250
    const h = canvas.offsetHeight || 120
    canvas.width = w * dpr; canvas.height = h * dpr
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const xMin = -5, xMax = 5, yMin = -5, yMax = 5
    const pad = 16
    const plotW = w - pad * 2; const plotH = h - pad * 2
    const xToPixel = x => pad + ((x - xMin) / (xMax - xMin)) * plotW
    const yToPixel = y => pad + ((yMax - y) / (yMax - yMin)) * plotH

    ctx.fillStyle = 'transparent'
    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 0.5
    for (let x = -4; x <= 4; x += 2) {
      const px = xToPixel(x)
      ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, h - pad); ctx.stroke()
    }
    for (let y = -4; y <= 4; y += 2) {
      const py = yToPixel(y)
      ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(w - pad, py); ctx.stroke()
    }

    const accent = accentMap[state.accentColor] || '#42a5f5'
    try {
      const compiled = new Function('x', '"use strict"; return ' + (graphState.expr ? parseExpression(graphState.expr) : '2*x+3'))
      ctx.save()
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.shadowColor = accent
      ctx.shadowBlur = 6
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= 100; i++) {
        const x = xMin + (i / 100) * (xMax - xMin)
        const y = compiled(x)
        if (isFinite(y) && y > -10 && y < 10) {
          const px = xToPixel(x); const py = yToPixel(y)
          if (!started) { ctx.moveTo(px, py); started = true }
          else ctx.lineTo(px, py)
        } else { started = false }
      }
      ctx.stroke()
      ctx.restore()
    } catch (e) {}
  }

  // ============================
  // LOADING OVERLAY
  // ============================
  function showLoading (text) {
    var overlay = document.getElementById('loadingOverlay')
    var textEl = document.getElementById('loadingText')
    if (overlay) overlay.style.display = 'flex'
    if (textEl) textEl.textContent = text || 'Cargando...'
  }

  function hideLoading () {
    var overlay = document.getElementById('loadingOverlay')
    if (overlay) overlay.style.display = 'none'
  }

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

  function showPrompt (title, opts) {
    opts = opts || {}
    opts.inputLabel = opts.label || ''
    opts.value = opts.value || ''
    opts.placeholder = opts.placeholder || ''
    return showActionModal(title, opts)
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
    const calcInput = document.getElementById('calcInput')
    const multInput = document.getElementById('multiplierInput')
    const divInput = document.getElementById('divisorInput')
    if (calcInput) calcInput.addEventListener('input', triggerScaleCalc)
    if (multInput) multInput.addEventListener('input', triggerScaleCalc)
    if (divInput) divInput.addEventListener('input', triggerScaleCalc)

    // Scale presets
    document.querySelectorAll('.preset-chip.scale-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        applyScalePreset(parseFloat(btn.dataset.scale))
      })
    })

    // Divisor presets
    document.querySelectorAll('.preset-chip[data-value]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-chip.scale-preset').forEach(b => b.classList.remove('active'))
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

    // ===== FORMULA CALCULATOR =====
    const formulaCalcExprInput = document.getElementById('formulaCalcExpr')
    if (formulaCalcExprInput) {
      formulaCalcExprInput.addEventListener('input', formulaCalcUpdate)
      formulaCalcExprInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') formulaCalcUpdate()
      })
    }

    // Formula calc eval button
    document.getElementById('formulaCalcEval')?.addEventListener('click', () => {
      formulaCalcUpdate()
      const expr = document.getElementById('formulaCalcExpr').value.trim()
      const result = document.getElementById('formulaCalcResult').textContent
      if (expr && result && result !== '—' && result !== 'Error') {
        addFormulaHistory(expr, { ...formulaCalcVars }, result)
        showToast('Resultado guardado en historial')
      }
    })

    // Formula calc clear
    document.getElementById('formulaCalcClear')?.addEventListener('click', formulaCalcClear)

    // Formula calc copy
    document.getElementById('formulaCalcCopy')?.addEventListener('click', () => {
      const val = document.getElementById('formulaCalcResult').textContent
      if (val && val !== '—') navigator.clipboard.writeText(val).then(() => showToast('Copiado: ' + val))
    })

    // Live variable input changes
    document.getElementById('formulaCalcVars')?.addEventListener('input', (e) => {
      const input = e.target.closest('.formula-calc-var-input')
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
        chips.innerHTML = vars.map(v => `<span class="formula-calc-var-chip" style="display:inline-flex;margin:2px"><span class="formula-calc-var-label">${v}</span></span>`).join('')
      } else {
        preview.style.display = 'none'
      }
    })

    // ===== SCIENTIFIC CALCULATOR =====
    document.querySelectorAll('.sci-key').forEach(btn => {
      btn.addEventListener('click', () => sciInput(btn.dataset.action))
    })

    // ===== GRAPH =====
    document.getElementById('graphBtn')?.addEventListener('click', () => {
      const input = document.getElementById('graphInput')
      graphState.expr = input.value.trim() || '2*x+3'
      graphState.xMin = -10; graphState.xMax = 10
      graphState.yMin = -10; graphState.yMax = 10
      graphState.zoom = 1
      drawGraph()
    })

    document.querySelectorAll('.graph-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('graphInput').value = btn.dataset.eq
        document.getElementById('graphBtn').click()
      })
    })

    document.getElementById('graphInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('graphBtn').click()
    })

    const canvas = document.getElementById('graphCanvas')

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1.1 : 0.9
      const cx = (graphState.xMin + graphState.xMax) / 2
      const cy = (graphState.yMin + graphState.yMax) / 2
      const rx = (graphState.xMax - graphState.xMin) / 2
      const ry = (graphState.yMax - graphState.yMin) / 2
      graphState.xMin = cx - rx * delta; graphState.xMax = cx + rx * delta
      graphState.yMin = cy - ry * delta; graphState.yMax = cy + ry * delta
      graphState.zoom *= (1 / delta)
      drawGraph()
    }, { passive: false })

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true
      dragStartX = e.clientX; dragStartY = e.clientY
      gsXMin = graphState.xMin; gsXMax = graphState.xMax
      gsYMin = graphState.yMin; gsYMax = graphState.yMax
    })
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      const rect = canvas.getBoundingClientRect()
      const plotW = rect.width - 96; const plotH = rect.height - 96
      const dx = (e.clientX - dragStartX) / plotW * (gsXMax - gsXMin)
      const dy = (e.clientY - dragStartY) / plotH * (gsYMax - gsYMin)
      graphState.xMin = gsXMin - dx; graphState.xMax = gsXMax - dx
      graphState.yMin = gsYMin + dy; graphState.yMax = gsYMax + dy
      drawGraph()
    })
    window.addEventListener('mouseup', () => { isDragging = false })

    let touchStartX = 0, touchStartY = 0, touchDist = 0
    let tsXMin, tsXMax, tsYMin, tsYMax

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY
        tsXMin = graphState.xMin; tsXMax = graphState.xMax
        tsYMin = graphState.yMin; tsYMax = graphState.yMax
      } else if (e.touches.length === 2) {
        touchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        tsXMin = graphState.xMin; tsXMax = graphState.xMax
        tsYMin = graphState.yMin; tsYMax = graphState.yMax
      }
    }, { passive: true })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (e.touches.length === 1 && isDragging) {
        const rect = canvas.getBoundingClientRect()
        const plotW = rect.width - 96; const plotH = rect.height - 96
        const dx = (e.touches[0].clientX - touchStartX) / plotW * (tsXMax - tsXMin)
        const dy = (e.touches[0].clientY - touchStartY) / plotH * (tsYMax - tsYMin)
        graphState.xMin = tsXMin - dx; graphState.xMax = tsXMax - dx
        graphState.yMin = tsYMin + dy; graphState.yMax = tsYMax + dy
        drawGraph()
      } else if (e.touches.length === 2) {
        const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        const scale = touchDist / newDist
        const cx = (tsXMin + tsXMax) / 2; const cy = (tsYMin + tsYMax) / 2
        graphState.xMin = cx - (tsXMax - tsXMin) / 2 * scale
        graphState.xMax = cx + (tsXMax - tsXMin) / 2 * scale
        graphState.yMin = cy - (tsYMax - tsYMin) / 2 * scale
        graphState.yMax = cy + (tsYMax - tsYMin) / 2 * scale
        graphState.zoom *= (1 / scale)
        touchDist = newDist
        drawGraph()
      }
    }, { passive: false })

    canvas.addEventListener('touchend', () => { isDragging = false })

    document.getElementById('graphReset')?.addEventListener('click', () => {
      graphState.xMin = -10; graphState.xMax = 10
      graphState.yMin = -10; graphState.yMax = 10
      graphState.zoom = 1
      drawGraph()
    })

    document.getElementById('graphFullscreen')?.addEventListener('click', () => {
      const wrap = document.getElementById('graphWrap')
      if (wrap.requestFullscreen) wrap.requestFullscreen()
      else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen()
    })

    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        drawGraph()
        drawMiniGraph()
      }, 200)
    })

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
        if (state.currentSection === 'graficos') drawGraph()
        drawMiniGraph()
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
    document.getElementById('appVersionValue').textContent = state.version || '3.0.0'

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

    requestAnimationFrame(() => {
      setTimeout(() => {
        drawGraph()
        drawMiniGraph()
      }, 150)
    })

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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()

  // ARC exposed API for Phase 2 — allows overriding internal functions
  window.__arc = {
    state: state,
    init: function() { return init(); },
    _origInit: init,
    setInit: function(fn) { init = fn; },
    navigateTo: function(s) { return navigateTo(s); },
    _origNavigateTo: navigateTo,
    setNavigateTo: function(fn) { navigateTo = fn; },
    loadState: function() { return loadState(); },
    _origLoadState: loadState,
    setLoadState: function(fn) { loadState = fn; },
    persistState: function() { return persistState(); },
    _origPersistState: persistState,
    setPersistState: function(fn) { persistState = fn; },
    showToast: showToast,
    renderHistory: renderHistory,
    renderFormulas: renderFormulas,
    showActionModal: showActionModal,
    showPrompt: showPrompt,
    showConfirm: showConfirm,
    showLoading: showLoading,
    hideLoading: hideLoading
  };
})()