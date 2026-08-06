const { ipcRenderer } = require('electron')

ipcRenderer.on('tabs:update', (_, payload) => {
  const tabs = Array.isArray(payload) ? payload : (payload.tabs || [])
  const authorizationSteps = Array.isArray(payload?.authorizationSteps) ? payload.authorizationSteps : []
  const bar = document.getElementById('tab-bar')
  bar.innerHTML = ''
  if (authorizationSteps.length > 0) {
    const stepsEl = document.createElement('div')
    stepsEl.className = 'auth-steps'
    const showStepPrefix = authorizationSteps.length > 1
    stepsEl.innerHTML = authorizationSteps.map((step, index) => `
      <div class="auth-step ${step.status || 'pending'}">
        ${showStepPrefix ? `<span class="auth-step-index">${index + 1}</span>` : ''}
        <span class="auth-step-text">${showStepPrefix ? `\u7b2c${index + 1}\u6b65\uff1a` : ''}${step.label}</span>
      </div>
    `).join('<span class="auth-step-line"></span>')
    bar.appendChild(stepsEl)
  }
  if (authorizationSteps.length > 0) {
    return
  }

  tabs.forEach(tab => {
    const el = document.createElement('div')
    el.className = 'tab' + (tab.active ? ' active' : '') + (tab.hidden ? ' hidden-tab' : '')
    el.dataset.tab = tab.id

    let html = `<span class="tab-label">${tab.label}</span>`
    if (tab.running && !tab.active) html += '<span class="dot"></span>'
    if (tab.active && tab.refreshable !== false) html += `<span class="refresh-btn" data-action="refresh" data-tab="${tab.id}" title="刷新">↻</span>`
    if (tab.closable) html += `<span class="close-btn" data-action="hide" data-tab="${tab.id}">×</span>`
    el.innerHTML = html

    el.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'refresh') {
        ipcRenderer.send('tabs:refresh', tab.id)
      } else if (e.target.dataset.action === 'hide') {
        ipcRenderer.send('tabs:hide', tab.id)
      } else {
        ipcRenderer.send('tabs:switch', tab.id)
      }
    })
    bar.appendChild(el)
  })
})

ipcRenderer.send('tabs:ready')
