/* ============================================
   ARC - Application Logic
   ============================================ */

;(function () {
  'use strict'

  // ============================
  // STATE
  // ============================
  const state = {
    currentSection: 'calculadora',
    calcMultiplier: 1,
    calcDivisor: 1,
    rounding: 2,
    animations: true,
    accentColor: 'blue',
    history: [],
    formulas: [],
    categories: ['arquitectura', 'fisica', 'matematica', 'personalizadas'],
    currentFormulaCategory: 'arquitectura'
  }

  // Accent color map
  const accentMap = {
    blue: '#42a5f5',
    purple: '#ab47bc',
    green: '#66bb6a',
    orange: '#ffa726',
    red: '#ef5350',
    teal: '#26a69a'
  }

  // ============================
  // STORAGE
  // ============================
  function loadState () {
    try {
      const saved = localStorage.getItem('arc_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        Object.assign(state, parsed)
      }
      const savedFormulas = localStorage.getItem('arc_formulas')
      if (savedFormulas) {
        state.formulas = JSON.parse(savedFormulas)
      }
      const savedHistory = localStorage.getItem('arc_history')
      if (savedHistory) {
        state.history = JSON.parse(savedHistory)
      }
    } catch (e) {}
  }

  function persistState () {
    try {
      const s = { ...state }
      delete s.formulas
      delete s.history
      localStorage.setItem('arc_state', JSON.stringify(s))
      localStorage.setItem('arc_formulas', JSON.stringify(state.formulas))
      localStorage.setItem('arc_history', JSON.stringify(state.history))
    } catch (e) {}
  }

  // ============================
  // ROUNDING
  // ============================
  function roundValue (value, decimals) {
    if (decimals === 0) return value
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  }

  function formatNumber (value, decimals) {
    if (decimals === 0) {
      return String(value)
    }
    return value.toFixed(decimals)
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
      setTimeout(() => toast.remove(), 300)
    }, 2000)
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
    // Update sections
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'))
    const target = document.getElementById('section-' + section)
    if (target) target.classList.add('active')
    // Sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section)
    })
    // Bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section)
    })
    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar')
    sidebar.classList.remove('open')
    // Scroll to top
    const content = document.querySelector('.content')
    if (content) content.scrollTop = 0
    // Persist
    persistState()
  }

  // ============================
  // SMART CALCULATOR
  // ============================
  function calculate () {
    const x = parseFloat(document.getElementById('calcInput').value)
    const mult = parseFloat(document.getElementById('multiplierInput').value) || state.calcMultiplier
    const div = parseFloat(document.getElementById('divisorInput').value) || state.calcDivisor
    const rounding = state.rounding

    state.calcMultiplier = mult
    state.calcDivisor = div

    if (isNaN(x) || isNaN(mult) || isNaN(div) || div === 0) {
      document.getElementById('resultValue').textContent = '—'
      document.getElementById('calcDisplay').textContent = '0'
      return
    }

    const result = (x * mult) / div
    const rounded = roundValue(result, rounding)
    const formatted = formatNumber(rounded, rounding)

    document.getElementById('calcDisplay').textContent = formatted
    document.getElementById('resultValue').textContent = formatted
    document.getElementById('calcFormula').textContent = `x · ${formatNumber(mult, 4)} ÷ ${formatNumber(div, 4)}`

    // Animate result
    const el = document.getElementById('resultValue')
    el.style.transition = 'none'
    el.style.transform = 'scale(1.05)'
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.2s ease'
      el.style.transform = 'scale(1)'
    })
  }

  function addHistory (x, mult, div, result) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toLocaleDateString('es-ES')
    state.history.unshift({
      id: Date.now(),
      x,
      mult,
      div,
      result,
      time: timeStr,
      date: dateStr,
      formula: `(${x} × ${mult}) ÷ ${div} = ${result}`
    })
    if (state.history.length > 200) state.history.length = 200
    persistState()
    renderHistory()
  }

  // ============================
  // HISTORY RENDER
  // ============================
  function renderHistory () {
    const list = document.getElementById('historyList')
    const empty = document.getElementById('historyEmpty')
    if (!list) return

    if (state.history.length === 0) {
      list.innerHTML = ''
      empty.style.display = 'flex'
      return
    }

    empty.style.display = 'none'
    list.innerHTML = state.history.map(item => `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-item-detail">
            <span class="history-item-result">${item.result}</span>
            <span class="history-item-time">${item.date} ${item.time}</span>
          </div>
          <div class="history-item-formula">${item.formula}</div>
        </div>
        <button class="history-item-copy" data-id="${item.id}" title="Copiar">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
        </button>
      </div>
    `).join('')
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
      { name: 'Raíz cuadrada', expr: 'Math.sqrt(x)', desc: '√x' },
      { name: 'Potencia', expr: 'Math.pow(x, x)', desc: 'xⁿ' },
      { name: 'Seno', expr: 'Math.sin(x)', desc: 'sin(x)' }
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

  function renderFormulas () {
    const container = document.getElementById('formulaList')
    if (!container) return

    const cat = state.currentFormulaCategory
    const filtered = state.formulas.filter(f => f.category === cat)

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="formula-empty">
          <svg viewBox="0 0 24 24" width="36" height="36" opacity="0.3"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm3 2h6v2H9V8zm0 4h6v2H9v-2zm0 4h4v2H9v-2z" fill="currentColor"/></svg>
          <p>Sin fórmulas en esta categoría</p>
        </div>`
      return
    }

    container.innerHTML = filtered.map(f => `
      <div class="formula-item">
        <div class="formula-item-header">
          <span class="formula-item-name">${f.name}</span>
          <div class="formula-item-actions">
            <button class="formula-item-action use" data-id="${f.id}" title="Usar fórmula">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
            </button>
            <button class="formula-item-action delete-f" data-id="${f.id}" title="Eliminar">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
        <div class="formula-item-expr">y = ${f.expr}</div>
        ${f.desc ? `<div class="formula-item-desc">${f.desc}</div>` : ''}
      </div>
    `).join('')
  }

  function useFormula (id) {
    const f = state.formulas.find(f => f.id === id)
    if (!f) return
    // Parse expression to extract multiplier/divisor or just set calc
    try {
      const expr = f.expr.replace(/x/g, '1')
      // Try to extract simple (x * mult) / div pattern
      const match = f.expr.match(/\(\s*x\s*\*\s*([\d.]+)\s*\)\s*\/\s*([\d.]+)/)
      if (match) {
        document.getElementById('multiplierInput').value = match[1]
        document.getElementById('divisorInput').value = match[2]
      }
      navigateTo('calculadora')
      showToast(`Fórmula "${f.name}" cargada`)
    } catch (e) {}
  }

  function deleteFormula (id) {
    state.formulas = state.formulas.filter(f => f.id !== id)
    persistState()
    renderFormulas()
    showToast('Fórmula eliminada')
  }

  // ============================
  // SCIENTIFIC CALCULATOR
  // ============================
  let sciExpr = ''
  let sciDisplay = '0'
  let sciResult = '0'

  function sciInput (action) {
    const expEl = document.getElementById('sciExpression')
    const resEl = document.getElementById('sciResult')

    if (action === 'clear') {
      sciExpr = ''
      sciDisplay = '0'
      sciResult = '0'
      expEl.textContent = '0'
      resEl.textContent = '0'
      return
    }

    if (action === 'backspace') {
      sciExpr = sciExpr.slice(0, -1)
      sciDisplay = sciExpr || '0'
      expEl.textContent = sciDisplay
      return
    }

    if (action === 'calculate') {
      try {
        const result = evalScientific(sciExpr)
        if (result !== null && isFinite(result)) {
          sciResult = formatNumber(roundValue(result, 8), 8)
          resEl.textContent = sciResult
        } else {
          resEl.textContent = 'Error'
        }
      } catch (e) {
        resEl.textContent = 'Error'
      }
      return
    }

    // Special functions
    if (action === 'sin') { sciExpr += 'Math.sin('; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'cos') { sciExpr += 'Math.cos('; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'tan') { sciExpr += 'Math.tan('; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'log') { sciExpr += 'Math.log10('; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'ln') { sciExpr += 'Math.log('; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'sqrt') { sciExpr += 'Math.sqrt('; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'sqr') { sciExpr += '^2'; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'pow') { sciExpr += '^'; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'pi') { sciExpr += 'Math.PI'; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'inv') { sciExpr += '1/('; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'perc') { sciExpr += '/100'; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'g') { sciExpr += '9.8'; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }
    if (action === 'densidad') { sciExpr += '/'; sciDisplay = sciExpr; expEl.textContent = sciDisplay; return }

    sciExpr += action
    sciDisplay = sciExpr
    expEl.textContent = sciDisplay
  }

  function evalScientific (expr) {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**')
    if (!/^[\d\s+\-*/().,%a-zA-Z]+$/.test(sanitized)) {
      return null
    }
    let open = (sanitized.match(/\(/g) || []).length
    let close = (sanitized.match(/\)/g) || []).length
    while (close < open) { sanitized += ')'; close++ }
    try {
      return Function('"use strict"; return (' + sanitized + ')')()
    } catch (e) {
      return null
    }
  }

  // ============================
  // GRAPHING SYSTEM
  // ============================
  let graphState = {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    expr: '2*x+3',
    zoom: 1
  }

  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let graphStartXMin = 0
  let graphStartXMax = 0
  let graphStartYMin = 0
  let graphStartYMax = 0

  function parseExpression (input) {
    let s = input.trim()
    // Handle y = prefix
    if (s.startsWith('y=')) s = s.substring(2).trim()
    if (s.startsWith('y=')) s = s.substring(2).trim()
    // Replace operators
    s = s.replace(/\^/g, '**')
    // Replace implicit multiplication: 2x -> 2*x
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
    // Add explicit multiplication for x before other tokens
    s = s.replace(/(\d)(x)/g, '$1*$2')
    s = s.replace(/(x)(\d)/g, '$1*$2')
    return s
  }

  function drawGraph () {
    const canvas = document.getElementById('graphCanvas')
    if (!canvas) return
    const rect = canvas.parentElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = rect.width
    const h = rect.height
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const xMin = graphState.xMin
    const xMax = graphState.xMax
    const yMin = graphState.yMin
    const yMax = graphState.yMax

    const pad = 40
    const plotW = w - pad * 2
    const plotH = h - pad * 2

    function xToPixel (x) { return pad + ((x - xMin) / (xMax - xMin)) * plotW }
    function yToPixel (y) { return pad + ((yMax - y) / (yMax - yMin)) * plotH }

    // Clear
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    const xStep = Math.pow(10, Math.floor(Math.log10((xMax - xMin) / 5)))
    const yStep = Math.pow(10, Math.floor(Math.log10((yMax - yMin) / 5)))

    for (let x = Math.floor(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const px = xToPixel(x)
      ctx.beginPath()
      ctx.moveTo(px, pad)
      ctx.lineTo(px, h - pad)
      ctx.stroke()
    }
    for (let y = Math.floor(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const py = yToPixel(y)
      ctx.beginPath()
      ctx.moveTo(pad, py)
      ctx.lineTo(w - pad, py)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1.5
    const x0 = xToPixel(0)
    const y0 = yToPixel(0)
    if (x0 >= pad && x0 <= w - pad) {
      ctx.beginPath(); ctx.moveTo(x0, pad); ctx.lineTo(x0, h - pad); ctx.stroke()
    }
    if (y0 >= pad && y0 <= h - pad) {
      ctx.beginPath(); ctx.moveTo(pad, y0); ctx.lineTo(w - pad, y0); ctx.stroke()
    }

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '11px ' + getComputedStyle(document.body).fontFamily
    ctx.textAlign = 'center'
    for (let x = Math.floor(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue
      const px = xToPixel(x)
      ctx.fillText(formatNumber(x, x % 1 === 0 ? 0 : 2), px, h - pad + 16)
    }
    ctx.textAlign = 'right'
    for (let y = Math.floor(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue
      const py = yToPixel(y)
      ctx.fillText(formatNumber(y, y % 1 === 0 ? 0 : 2), pad - 8, py + 4)
    }

    // Plot
    const expr = graphState.expr
    if (!expr) return

    try {
      const compiled = new Function('x', '"use strict"; return ' + parseExpression(expr))
      ctx.strokeStyle = accentMap[state.accentColor] || '#42a5f5'
      ctx.lineWidth = 2.5
      ctx.shadowColor = accentMap[state.accentColor] || '#42a5f5'
      ctx.shadowBlur = 8
      ctx.beginPath()
      let started = false
      const steps = Math.max(200, Math.floor(plotW * 1.5))
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin)
        try {
          const y = compiled(x)
          if (isFinite(y) && y > -1000 && y < 1000) {
            const px = xToPixel(x)
            const py = yToPixel(y)
            if (!started) { ctx.moveTo(px, py); started = true }
            else { ctx.lineTo(px, py) }
          } else {
            started = false
          }
        } catch (e) {
          started = false
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    } catch (e) {
      // Invalid expression
    }

    // Zoom label
    document.getElementById('graphZoomLabel').textContent = Math.round(graphState.zoom * 100) + '%'
  }

  function resizeGraph () {
    drawGraph()
  }

  // ============================
  // SETTINGS
  // ============================
  function applyAccentColor (color) {
    state.accentColor = color
    const root = document.documentElement
    const hex = accentMap[color] || '#42a5f5'
    root.style.setProperty('--accent', hex)
    root.style.setProperty('--accent-light', hex)
    root.style.setProperty('--accent-glow', hex + '66')
    // Update active color button
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color)
    })
    persistState()
  }

  // ============================
  // EVENT BINDING
  // ============================
  function init () {
    loadState()

    // Navigation: sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.section))
    })

    // Navigation: bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.section))
    })

    // Menu toggle (mobile)
    document.querySelectorAll('.menu-btn, .menu-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        document.getElementById('sidebar').classList.toggle('open')
      })
    })

    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar')
      if (sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !e.target.closest('.menu-btn') && !e.target.closest('.menu-toggle')) {
          sidebar.classList.remove('open')
        }
      }
    })

    // Calculator: live input
    const calcInput = document.getElementById('calcInput')
    const multInput = document.getElementById('multiplierInput')
    const divInput = document.getElementById('divisorInput')

    let calcTimeout
    function onCalcChange () {
      clearTimeout(calcTimeout)
      calcTimeout = setTimeout(() => {
        calculate()
        const x = parseFloat(calcInput.value)
        if (!isNaN(x)) {
          const mult = parseFloat(multInput.value) || 1
          const div = parseFloat(divInput.value) || 1
          const result = roundValue((x * mult) / div, state.rounding)
          addHistory(x, mult, div, formatNumber(result, state.rounding))
        }
      }, 400)
    }

    calcInput.addEventListener('input', onCalcChange)
    multInput.addEventListener('input', onCalcChange)
    divInput.addEventListener('input', onCalcChange)

    // Preset divisors
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        if (btn.dataset.value === 'custom') {
          document.getElementById('divisorInput').focus()
          return
        }
        document.getElementById('divisorInput').value = btn.dataset.value
        onCalcChange()
      })
    })

    // Rounding
    document.querySelectorAll('.rounding-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rounding-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        state.rounding = parseInt(btn.dataset.round) || 2
        persistState()
        calculate()
      })
    })

    // Copy result
    document.getElementById('copyResult').addEventListener('click', () => {
      const val = document.getElementById('resultValue').textContent
      if (val && val !== '—') {
        navigator.clipboard.writeText(val).then(() => showToast('Copiado: ' + val))
      }
    })

    // History: copy all
    document.getElementById('copyAllHistory')?.addEventListener('click', () => {
      if (state.history.length === 0) { showToast('Sin historial'); return }
      const text = state.history.map(h => h.formula).join('\n')
      navigator.clipboard.writeText(text).then(() => showToast('Historial copiado'))
    })

    // History: delete all
    document.getElementById('deleteAllHistory')?.addEventListener('click', () => {
      if (state.history.length === 0) { showToast('Sin historial'); return }
      state.history = []
      persistState()
      renderHistory()
      showToast('Historial eliminado')
    })

    // History list (delegated)
    document.getElementById('historyList')?.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.history-item-copy')
      if (copyBtn) {
        const id = parseInt(copyBtn.dataset.id)
        const item = state.history.find(h => h.id === id)
        if (item) {
          navigator.clipboard.writeText(item.formula).then(() => showToast('Copiado'))
        }
      }
    })

    // Formulas: categories
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        state.currentFormulaCategory = btn.dataset.category
        renderFormulas()
      })
    })

    // Formulas list (delegated)
    document.getElementById('formulaList')?.addEventListener('click', (e) => {
      const useBtn = e.target.closest('.use')
      const delBtn = e.target.closest('.delete-f')
      if (useBtn) {
        useFormula(parseFloat(useBtn.dataset.id))
      }
      if (delBtn) {
        deleteFormula(parseFloat(delBtn.dataset.id))
      }
    })

    // Add formula button
    document.getElementById('addFormulaBtn')?.addEventListener('click', () => {
      document.getElementById('formulaModal').classList.add('open')
      document.getElementById('formulaName').value = ''
      document.getElementById('formulaExpression').value = ''
      document.getElementById('formulaDesc').value = ''
      document.getElementById('formulaCategory').value = state.currentFormulaCategory
    })

    // Modal
    document.getElementById('modalClose')?.addEventListener('click', () => {
      document.getElementById('formulaModal').classList.remove('open')
    })
    document.getElementById('modalCancel')?.addEventListener('click', () => {
      document.getElementById('formulaModal').classList.remove('open')
    })
    document.getElementById('modalSave')?.addEventListener('click', () => {
      const name = document.getElementById('formulaName').value.trim()
      const expr = document.getElementById('formulaExpression').value.trim()
      const desc = document.getElementById('formulaDesc').value.trim()
      const cat = document.getElementById('formulaCategory').value
      if (!name || !expr) { showToast('Nombre y fórmula requeridos'); return }
      state.formulas.push({
        id: Date.now() + Math.random(),
        name,
        expr,
        desc,
        category: cat
      })
      persistState()
      renderFormulas()
      document.getElementById('formulaModal').classList.remove('open')
      showToast('Fórmula guardada')
    })

    // Scientific calculator
    document.querySelectorAll('.sci-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sciInput(btn.dataset.action)
      })
    })

    // Graphing
    document.getElementById('graphBtn')?.addEventListener('click', () => {
      const input = document.getElementById('graphInput')
      graphState.expr = input.value.trim() || '2*x+3'
      graphState.xMin = -10
      graphState.xMax = 10
      graphState.yMin = -10
      graphState.yMax = 10
      graphState.zoom = 1
      drawGraph()
    })

    document.querySelectorAll('.graph-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('graphInput').value = btn.dataset.eq
        document.getElementById('graphBtn').click()
      })
    })

    // Graph: keyboard enter
    document.getElementById('graphInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('graphBtn').click()
    })

    // Graph: zoom with mouse wheel
    const canvas = document.getElementById('graphCanvas')
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1.1 : 0.9
      const cx = (graphState.xMin + graphState.xMax) / 2
      const cy = (graphState.yMin + graphState.yMax) / 2
      const rx = (graphState.xMax - graphState.xMin) / 2
      const ry = (graphState.yMax - graphState.yMin) / 2
      graphState.xMin = cx - rx * delta
      graphState.xMax = cx + rx * delta
      graphState.yMin = cy - ry * delta
      graphState.yMax = cy + ry * delta
      graphState.zoom *= (1 / delta)
      drawGraph()
    }, { passive: false })

    // Graph: drag to pan
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true
      dragStartX = e.clientX
      dragStartY = e.clientY
      graphStartXMin = graphState.xMin
      graphStartXMax = graphState.xMax
      graphStartYMin = graphState.yMin
      graphStartYMax = graphState.yMax
    })

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const pad = 40
      const plotW = w - pad * 2
      const plotH = h - pad * 2
      const dx = (e.clientX - dragStartX) / plotW * (graphStartXMax - graphStartXMin)
      const dy = (e.clientY - dragStartY) / plotH * (graphStartYMax - graphStartYMin)
      graphState.xMin = graphStartXMin - dx
      graphState.xMax = graphStartXMax - dx
      graphState.yMin = graphStartYMin + dy
      graphState.yMax = graphStartYMax + dy
      drawGraph()
    })

    window.addEventListener('mouseup', () => { isDragging = false })

    // Touch support for graph
    let touchStartX = 0, touchStartY = 0
    let touchDist = 0
    let touchStartXMin, touchStartXMax, touchStartYMin, touchStartYMax

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        graphStartXMin = graphState.xMin
        graphStartXMax = graphState.xMax
        graphStartYMin = graphState.yMin
        graphStartYMax = graphState.yMax
      } else if (e.touches.length === 2) {
        touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        graphStartXMin = graphState.xMin
        graphStartXMax = graphState.xMax
        graphStartYMin = graphState.yMin
        graphStartYMax = graphState.yMax
      }
    }, { passive: true })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (e.touches.length === 1 && isDragging) {
        const rect = canvas.getBoundingClientRect()
        const w = rect.width
        const h = rect.height
        const pad = 40
        const plotW = w - pad * 2
        const plotH = h - pad * 2
        const dx = (e.touches[0].clientX - touchStartX) / plotW * (graphStartXMax - graphStartXMin)
        const dy = (e.touches[0].clientY - touchStartY) / plotH * (graphStartYMax - graphStartYMin)
        graphState.xMin = graphStartXMin - dx
        graphState.xMax = graphStartXMax - dx
        graphState.yMin = graphStartYMin + dy
        graphState.yMax = graphStartYMax + dy
        drawGraph()
      } else if (e.touches.length === 2) {
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const scale = touchDist / newDist
        const cx = (graphStartXMin + graphStartXMax) / 2
        const cy = (graphStartYMin + graphStartYMax) / 2
        const rx = (graphStartXMax - graphStartXMin) / 2
        const ry = (graphStartYMax - graphStartYMin) / 2
        graphState.xMin = cx - rx * scale
        graphState.xMax = cx + rx * scale
        graphState.yMin = cy - ry * scale
        graphState.yMax = cy + ry * scale
        graphState.zoom *= (1 / scale)
        touchDist = newDist
        drawGraph()
      }
    }, { passive: false })

    canvas.addEventListener('touchend', () => { isDragging = false })

    // Graph reset
    document.getElementById('graphReset')?.addEventListener('click', () => {
      graphState.xMin = -10
      graphState.xMax = 10
      graphState.yMin = -10
      graphState.yMax = 10
      graphState.zoom = 1
      drawGraph()
    })

    // Window resize
    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resizeGraph, 200)
    })

    // Settings
    document.getElementById('settingDecimals')?.addEventListener('change', (e) => {
      state.rounding = parseInt(e.target.value) || 2
      document.querySelectorAll('.rounding-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.round) === state.rounding)
      })
      persistState()
      calculate()
    })

    document.getElementById('settingAnimations')?.addEventListener('change', (e) => {
      state.animations = e.target.checked
      document.querySelector('.content').style.transition = state.animations ? '' : 'none'
      persistState()
    })

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyAccentColor(btn.dataset.color)
        // Redraw graph if visible
        if (state.currentSection === 'graficos') drawGraph()
      })
    })

    // Clear all data
    document.getElementById('clearAllData')?.addEventListener('click', () => {
      if (confirm('¿Borrar todos los datos? Esta acción no se puede deshacer.')) {
        state.history = []
        state.formulas = []
        persistState()
        renderHistory()
        initFormulas()
        showToast('Todos los datos eliminados')
      }
    })

    // Export formulas
    document.getElementById('exportFormulas')?.addEventListener('click', () => {
      const data = JSON.stringify(state.formulas, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'arc-formulas.json'
      a.click()
      URL.revokeObjectURL(url)
      showToast('Fórmulas exportadas')
    })

    // Import formulas
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
              if (f.name && f.expr && f.category) {
                state.formulas.push({ ...f, id: Date.now() + Math.random() })
              }
            }
            persistState()
            renderFormulas()
            showToast('Fórmulas importadas')
          }
        } catch (err) {
          showToast('Error al importar')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    })

    // Apply accent color from saved state
    applyAccentColor(state.accentColor)

    // Set rounding UI
    document.querySelectorAll('.rounding-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.round) === state.rounding)
    })

    // Set preset if divisor matches
    const divVal = parseFloat(document.getElementById('divisorInput').value)
    document.querySelectorAll('.preset-btn').forEach(b => {
      if (b.dataset.value === String(divVal)) b.classList.add('active')
    })

    // Init sections
    navigateTo(state.currentSection)
    renderHistory()
    initFormulas()
    calculate()

    // Init graph after a frame
    requestAnimationFrame(() => {
      setTimeout(() => {
        graphState.expr = '2*x+3'
        drawGraph()
      }, 100)
    })

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.register('sw.js')
      } catch (e) {}
    }
  }

  // ============================
  // START
  // ============================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

})()
