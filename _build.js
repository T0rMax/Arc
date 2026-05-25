const fs = require('fs');
const path = 'C:/Users/mxsys/OneDrive/Documentos/program/arc';

// =============================================
// READ EXISTING FILES
// =============================================
const oldHtml = fs.readFileSync(path + '/index.html', 'utf8');
const oldCss = fs.readFileSync(path + '/css/style.css', 'utf8');
const oldJs = fs.readFileSync(path + '/js/app.js', 'utf8');

// =============================================
// BUILD NEW HTML
// =============================================
// We'll insert new nav items and sections using string replacement
// For simplicity, rebuild the whole file

let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#0a0a0a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="ARC">
  <meta name="description" content="Plataforma profesional de c\u00e1lculos para arquitectura e ingenier\u00eda">
  <meta name="application-name" content="ARC">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="format-detection" content="telephone=no">
  <link rel="manifest" href="manifest.json">
  <link rel="icon" type="image/svg+xml" href="icons/icon-192.svg">
  <link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="icons/icon-512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">
  <link rel="apple-touch-icon" sizes="192x192" href="icons/icon-192.png">
  <link rel="apple-touch-icon" sizes="512x512" href="icons/icon-512.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <title>ARC — Plataforma de C\u00e1lculos</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div id="app">

  <div class="ambient-bg" aria-hidden="true">
    <div class="ambient-blob blob-1"></div>
    <div class="ambient-blob blob-2"></div>
    <div class="ambient-blob blob-3"></div>
    <div class="ambient-noise"></div>
  </div>

  <!-- ===== SIDEBAR ===== -->
  <aside id="sidebar" class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <div class="logo-icon-wrap">
          <svg viewBox="0 0 36 36" class="logo-icon">
            <defs><linearGradient id="lg" x1="0" y1="0" x2="36" y2="36"><stop offset="0%" stop-color="#64b5f6"/><stop offset="100%" stop-color="#42a5f5"/></linearGradient></defs>
            <rect width="36" height="36" rx="10" fill="url(#lg)" opacity="0.15"/>
            <text x="18" y="25" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="18" fill="url(#lg)">A</text>
          </svg>
        </div>
        <span class="logo-text">ARC</span>
      </div>
    </div>
    <nav class="sidebar-nav" id="sidebarNav">
      <button class="nav-item active" data-section="dashboard"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/></svg><span>Inicio</span></button>
      <button class="nav-item" data-section="proyectos"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" fill="currentColor"/></svg><span>Prryectos</span></button>
      <button class="nav-item" data-section="notas"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z" fill="currentColor"/></svg><span>Notas</span></button>
      <button class="nav-item" data-section="escalas"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M7 2h10a3 3 0 013 3v14a3 3 0 01-3 3H7a3 3 0 01-3-3V5a3 3 0 013-3z" fill="currentColor"/></svg><span>Escalas</span></button>
      <button class="nav-item" data-section="formulas"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg><span>F\u00f3rmulas</span></button>
      <button class="nav-item" data-section="cientifica"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/></svg><span>Cient\u00edfica</span></button>
      <button class="nav-item" data-section="graficos"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M3 3v18h18v-2H5V3H3z" fill="currentColor"/></svg><span>Gr\u00e1ficos/pant>
      <button class="nav-item" data-section="canvas"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z" fill="currentColor"/></svg><span>Canvas</span></button>
      <button class="nav-item" data-section="historial"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18z" fill="currentColor"/></svg><span>Historial</span></button>
      <button class="nav-item" data-section="ajustes"><svg viewBox="0 0 24 24" class="nav-icon"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22.08-.47 0-.59-.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z" fill="currentColor"/></svg><span>Ajustes</span></button>
    </nav>
    <div class="sidebar-footer">
      <button id="cmdPaletteBtn" class="sidebar-cmd-btn" titl="Comando r\u00e1ido (⌘K)">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 6a2 2 0 012-2h1a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h1a22 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1zm10 0a2 2 0 012-2h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1" fill="currentColor"/></svg>
        <span>Comandos</span>
        <kd class="cmd-kbd">\u2318K</kbd>      </button>
      <span class="sidebar-version">ARC 3.0</span>
    </d>
  </aside>

  <!-- ===== MAIN CONTENT ===== -->
  <main id="content" class="content">

    <!-- ====== DASHBOARD ====== -->
    <section id="secton-dahboard" class="section active">
      <div class="section-header">
        <div class="header-left">
          <button class="menu-btn" aria-label="Men\u00fa"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor"/></svg></button>
          <h1 class="section-title">Inicio</h1>
        </div>
        <div class="header-right">
          <button class="header-icon-btn" id="dashCmdBtn" title="Comandos (\u2318K)"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 6a22 0 012-2h1a2 20 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h1a2 20 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1zm10 0a2 2 0 012-2h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1z" fill="currentColor"/></svg></button>
        </div>
      </div>

      <div class="dash-container">
        <div class="dash-welcome glass">
          <div class="dash-welcome-text">
            <h2 class="dash-greeting" id="dashGreeting">Buenos d\u00edas</h2>
            <p class="dash-datetime" id="dashDatetime">—</p>
          </div>
          <div class="dash-stats">
            <div class"dash-stat"><span class="dash-stat-value" id="dashCalcCount">0</span><span class="dash-stat-label">Hoy</span></div>
            <div class="dash-stat"><span class="dash-stat-value" id="dashFormulaCount">0</span><span class="dash-stat-label">F\u00f3rmulas</span></div>
            <div class="dash-stat"><span class="dash-stat-value" id="dashFavCout">0</span><span class="dash-stat-label">Favoritas</span></div>
          </div>
        </div>

        <div class="dash-quick-actions glass">
          <h3 class="dash-section-title">Acciones r\u00e1pida</h3>
          <div class="dash-actions-grid" id="dashActionsGrid">
            <button class="dash-action" data-action="escalas" style="--accent-c:#42a5f5"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 2h10a3 3 0 013 3v14a3 3 0 01-3 3H7a3 3 0 01-3-3V5a3 3 0 013-3z" fill="currentColor"/></svg></div><span>Escalas</span></button>
            <button class="dash-action" data-action="nueva-frmula" style="--accent-c:#ab47bc"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor"/></svg></div><span>Nueva f\u00f3rmula</span></button>
            <button class="das-action" data-action="graficos" style="--accent-c:#ffa726"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 3v18h18v-2H5V3H3zm4 4v10h2V7H7zm4 3v7h2v-7h3-3v10h2V7h-2z" fill="currentColor"/></svg></div><span>Graficar funci\u00f3n</span></button>
            <button class="dash-action" data-action="cientifica" style="--acebt-c:#66bb6a"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/></svg></div><span>Cient\u00edica</span></button>
            <button class="dash-action" data-action="historial" style="--accent-c:#26a69a"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18z" fill="currentColor"/></svg></div><span>Ver historial</span></button>
          </div>
        </div>
`;

console.log('HTML part 2 generated (' + html.length + ' chars)');
// Actually write it
const partial = html;
// We'll need many more parts... this is too big for single file
// Let's use edit operations on existing file instead
console.log('Checking existing sections...');
const sections = oldHtml.match(/<!-- ====== ([A-Z ]+) ====== -->/);
console.log('Found sections:', sections ? sections.map(s => s.substring(4, s.lastIndexOf(' ')).join(', ') : 'none');