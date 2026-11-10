import Phaser from 'phaser'

type PlayerId = 0 | 1
type Direction = 'up' | 'down' | 'left' | 'right'
type GameState = 'setup' | 'active' | 'feedback' | 'finished'
type ScreenName = 'setup' | 'game' | 'records'
type OptionKey = 'A' | 'B' | 'C' | 'D'

type Question = {
  id: number
  category: 'Formativa' | 'Laboral'
  question: string
  options: Record<OptionKey, string>
  correct: OptionKey
}

type MatchRecord = {
  id: string
  completedAt: string
  players: [{ name: string; score: number }, { name: string; score: number }]
  winner: string | null
}

type PlayerPosition = { x: number; y: number; score: number; frozenUntil: number }

const questions: Question[] = [
  { id: 1, category: 'Formativa', question: 'En un proyecto de formación, un integrante no entrega su parte a tiempo. ¿Qué acción debe tomar el equipo?', options: { A: 'Excluirlo de la presentación sin avisarle.', B: 'Asumir todo su trabajo y no informarle al instructor.', C: 'Dialogar para identificar el obstáculo y reasignar tareas.', D: 'Cancelar el proyecto y pedir cambio de equipo.' }, correct: 'C' },
  { id: 2, category: 'Formativa', question: 'Durante una lluvia de ideas para resolver un caso, surgen dos propuestas opuestas. ¿Cómo se define el rumbo?', options: { A: 'La propuesta del líder del grupo se aprueba automáticamente.', B: 'Se evalúan los criterios de viabilidad y se busca una solución integradora.', C: 'Se somete a cara o sello para no perder tiempo.', D: 'Se implementa la idea más rápida sin importar la calidad.' }, correct: 'B' },
  { id: 3, category: 'Formativa', question: '¿Cuál es el rol principal de la escucha activa en un equipo de aprendizaje?', options: { A: 'Esperar el turno para imponer el punto de vista propio.', B: 'Asentir a todo lo que diga el instructor o el líder.', C: 'Comprender las ideas del interlocutor antes de formular una respuesta.', D: 'Tomar notas en silencio sin participar en la discusión.' }, correct: 'C' },
  { id: 4, category: 'Formativa', question: 'Si se presenta un conflicto interpersonal entre dos aprendices dentro del proyecto, el equipo debe:', options: { A: 'Ignorar la situación para no involucrarse.', B: 'Tomar partido por el compañero más antiguo.', C: 'Facilitar un espacio de mediación enfocado en objetivos comunes.', D: 'Suspender las reuniones del equipo indefinidamente.' }, correct: 'C' },
  { id: 5, category: 'Formativa', question: 'La coevaluación en un equipo de formación tiene como objetivo principal:', options: { A: 'Evidenciar los errores de los compañeros para bajar su nota.', B: 'Retroalimentar constructivamente para potenciar el crecimiento profesional.', C: 'Asignar culpas en caso de que el proyecto no funcione.', D: 'Cumplir un requisito formal sin generar cambios reales.' }, correct: 'B' },
  { id: 6, category: 'Laboral', question: 'Ante una entrega crítica con un cliente y un retraso imprevisto, ¿cuál es la actitud de un equipo de alto rendimiento?', options: { A: 'Buscar al responsable del error para reportarlo a gerencia.', B: 'Reorganizar prioridades colectivamente y ejecutar un plan de contingencia.', C: 'Trabajar individualmente en lo que cada uno considere prioritario.', D: 'Esperar a que el líder resuelva el problema por su cuenta.' }, correct: 'B' },
  { id: 7, category: 'Laboral', question: '¿Qué caracteriza la verdadera delegación de tareas en un entorno laboral colaborativo?', options: { A: 'Asignar el trabajo operativo que nadie quiere hacer.', B: 'Otorgar autonomía basada en fortalezas con responsabilidad compartida.', C: 'Supervisar cada minuto del trabajo del colaborador.', D: 'Desentenderse por completo del resultado final.' }, correct: 'B' },
  { id: 8, category: 'Laboral', question: 'Un miembro del equipo comete un error grave en un reporte de sostenibilidad. ¿Cómo reacciona el grupo?', options: { A: 'Corregir el error en silencio y desconfiar de su trabajo futuro.', B: 'Enviar un correo copiando a la directiva para deslindar responsabilidad.', C: 'Analizar la causa raíz como equipo para prevenir su repetición.', D: 'Exigir que trabaje horas extra solo hasta solucionarlo.' }, correct: 'C' },
  { id: 9, category: 'Laboral', question: 'La alineación entre objetivos individuales y metas organizacionales en un equipo se logra cuando:', options: { A: 'Todos los integrantes realizan exactamente las mismas funciones.', B: 'Existe claridad en la visión común y cada miembro comprende su impacto.', C: 'Se ofrecen incentivos económicos únicamente al más rápido.', D: 'El líder toma todas las decisiones sin consultar al grupo.' }, correct: 'B' },
  { id: 10, category: 'Laboral', question: 'En un entorno de trabajo diverso (multidisciplinario), la mayor ventaja del equipo es:', options: { A: 'La rapidez para llegar a acuerdos sin debatirlos.', B: 'La homogeneidad en las opiniones y metodologías de trabajo.', C: 'La multiplicidad de perspectivas que enriquece la innovación.', D: 'La facilidad para jerarquizar el mando según la experiencia.' }, correct: 'C' },
]

const feedbackByQuestion: Record<number, string> = {
  1: 'Dialogar permite entender qué impidió la entrega y reorganizar el trabajo sin excluir ni ocultar el problema.',
  2: 'Comparar viabilidad y combinar aportes convierte el desacuerdo en una decisión compartida y mejor sustentada.',
  3: 'La escucha activa busca comprender antes de responder; no es esperar turno ni aceptar todo sin criterio.',
  4: 'La mediación ayuda a resolver el conflicto con respeto y a recuperar los objetivos comunes del proyecto.',
  5: 'La coevaluación sirve para ofrecer observaciones útiles que fortalezcan el aprendizaje y el desempeño.',
  6: 'Un equipo de alto rendimiento reorganiza prioridades en conjunto y acuerda acciones para cumplir la entrega.',
  7: 'Delegar bien conecta las fortalezas de cada persona con autonomía y responsabilidad compartida.',
  8: 'Analizar la causa raíz permite corregir el proceso y evitar que el error vuelva a ocurrir.',
  9: 'Una visión compartida permite que cada integrante entienda cómo su aporte contribuye a la meta organizacional.',
  10: 'La diversidad de perspectivas amplía las formas de analizar un reto y favorece soluciones innovadoras.',
}

const mazeRows = [
  '#################',
  '#...#...#...#...#',
  '#.#.#.#.#.#.#.#.#',
  '#...#...#...#...#',
  '.................',
  '#...#...#...#...#',
  '#...#...#...#...#',
  '#...#...#...#...#',
  '##.###.###.###.#',
]
const gates: { letter: OptionKey; x: number; y: number; color: number }[] = [
  { letter: 'A', x: 2, y: 8, color: 0x805536 },
  { letter: 'B', x: 6, y: 8, color: 0x248941 },
  { letter: 'C', x: 10, y: 8, color: 0x9aa947 },
  { letter: 'D', x: 14, y: 8, color: 0x9c5b40 },
]
const storageKey = 'sena-team-challenge.matches.v1'
const playerNames: [string, string] = ['', '']
const positions: [PlayerPosition, PlayerPosition] = [
  { x: 0, y: 4, score: 0, frozenUntil: 0 },
  { x: 16, y: 4, score: 0, frozenUntil: 0 },
]

let matches = loadMatches()
let gameState: GameState = 'setup'
let currentScreen: ScreenName = 'setup'
let recordsReturnScreen: ScreenName = 'setup'
let questionIndex = 0
let secondsLeft = 45
let timerInterval: number | undefined
let feedbackTimeout: number | undefined
let wrongAttempts: { player: PlayerId; answer: OptionKey }[] = []
let timeExpired = false
let game: Phaser.Game | undefined
let mazeScene: MazeScene | undefined
let lastSaveSucceeded = true

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (!found) throw new Error(`Missing page element: ${id}`)
  return found as T
}

function normalizeName(name: string): string {
  return name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

function loadMatches(): MatchRecord[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter((match): match is MatchRecord =>
      Boolean(match && typeof match.id === 'string' && typeof match.completedAt === 'string' &&
        Array.isArray(match.players) && match.players.length === 2 &&
        match.players.every((player: unknown) => Boolean(player && typeof player === 'object' && 'name' in player && typeof player.name === 'string' && 'score' in player && typeof player.score === 'number')) &&
        (match.winner === null || typeof match.winner === 'string')),
    )
  } catch {
    return []
  }
}

function saveMatches(): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(matches))
    return true
  } catch {
    return false
  }
}

function setScreen(screen: ScreenName): void {
  currentScreen = screen
  element('setup-screen').classList.toggle('hidden', screen !== 'setup')
  element('game-screen').classList.toggle('hidden', screen !== 'game')
  element('records-screen').classList.toggle('hidden', screen !== 'records')
  updateOrientationNotice()
  if (screen === 'game') {
    requestAnimationFrame(() => {
      game?.scale.refresh()
      mazeScene?.redraw()
    })
  }
}

function setStatus(message: string, tone: 'neutral' | 'good' | 'bad' = 'neutral'): void {
  const status = element('game-status')
  status.textContent = message
  status.dataset.tone = tone
}

function currentQuestion(): Question {
  return questions[questionIndex]
}

function renderQuestion(): void {
  const question = currentQuestion()
  element('round-current').textContent = String(questionIndex + 1).padStart(2, '0')
  element('question-number').textContent = String(question.id).padStart(2, '0')
  element('question-category').textContent = question.category.toLocaleUpperCase('es')
  element('question-text').textContent = question.question
  const options = element('answer-options')
  options.replaceChildren()
  for (const letter of ['A', 'B', 'C', 'D'] as const) {
    const option = document.createElement('span')
    option.className = 'answer-option'
    const key = document.createElement('b')
    key.textContent = letter
    const text = document.createElement('span')
    text.textContent = question.options[letter]
    option.append(key, text)
    options.append(option)
  }
  updateTimerDisplay()
}

function updateScoreboard(): void {
  element('score-name-one').textContent = playerNames[0]
  element('score-name-two').textContent = playerNames[1]
  element('pad-name-one').textContent = playerNames[0]
  element('pad-name-two').textContent = playerNames[1]
  element('maze-name-one').textContent = playerNames[0].toLocaleUpperCase('es')
  element('maze-name-two').textContent = playerNames[1].toLocaleUpperCase('es')
  element('score-one').textContent = String(positions[0].score)
  element('score-two').textContent = String(positions[1].score)
  mazeScene?.redraw()
}

function updateTimerDisplay(): void {
  element('timer-value').textContent = String(secondsLeft).padStart(2, '0')
  const percent = Math.max(0, Math.min(100, (secondsLeft / 45) * 100))
  element('timer-bar').style.width = `${percent}%`
  element('timer-value').classList.toggle('timer-low', secondsLeft <= 10)
  element('timer-bar').classList.toggle('timer-bar-low', secondsLeft <= 10)
}

function resetPlayers(): void {
  positions[0] = { x: 0, y: 4, score: positions[0].score, frozenUntil: 0 }
  positions[1] = { x: 16, y: 4, score: positions[1].score, frozenUntil: 0 }
  mazeScene?.redraw()
}

function startTimer(): void {
  window.clearInterval(timerInterval)
  secondsLeft = 45
  updateTimerDisplay()
  timerInterval = window.setInterval(() => {
    if (gameState !== 'active') return
    secondsLeft -= 1
    updateTimerDisplay()
    if (secondsLeft <= 0) {
      timeExpired = true
      showRoundFeedback()
    }
  }, 1000)
}

function startGame(names = playerNames): void {
  playerNames[0] = names[0]
  playerNames[1] = names[1]
  positions[0].score = 0
  positions[1].score = 0
  questionIndex = 0
  wrongAttempts = []
  timeExpired = false
  gameState = 'active'
  element('feedback-overlay').classList.add('hidden')
  element('result-overlay').classList.add('hidden')
  setScreen('game')
  renderQuestion()
  updateScoreboard()
  setStatus('Alcanza una puerta y pulsa SELECT para confirmar.')
  startTimer()
  ensureGame()
  window.setTimeout(() => {
    mazeScene?.resetPositions()
    mazeScene?.redraw()
  }, 80)
}

function ensureGame(): void {
  if (game) return
  game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'maze-root',
    backgroundColor: '#245a3c',
    scale: { mode: Phaser.Scale.RESIZE, width: 680, height: 360 },
    render: { antialias: true, pixelArt: false, roundPixels: true },
    scene: [MazeScene],
    audio: { noAudio: true },
  })
}

function movePlayer(player: PlayerId, direction: Direction): void {
  if (gameState !== 'active') return
  const state = positions[player]
  if (Date.now() < state.frozenUntil) {
    const remaining = Math.ceil((state.frozenUntil - Date.now()) / 1000)
    setStatus(`${playerNames[player]} está en pausa: ${remaining}s.`, 'bad')
    return
  }
  const delta: Record<Direction, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
  const [dx, dy] = delta[direction]
  const nextX = state.x + dx
  const nextY = state.y + dy
  if (!mazeRows[nextY] || mazeRows[nextY][nextX] !== '.') return
  state.x = nextX
  state.y = nextY
  mazeScene?.redraw()
  const gate = gates.find((candidate) => candidate.x === nextX && candidate.y === nextY)
  if (gate) setStatus(`${playerNames[player]} llegó a la puerta ${gate.letter}. Pulsa SELECT para responder.`, 'neutral')
}

function selectGate(player: PlayerId): void {
  if (gameState !== 'active') return
  const state = positions[player]
  if (Date.now() < state.frozenUntil) {
    setStatus(`${playerNames[player]} debe esperar para volver a jugar.`, 'bad')
    return
  }
  const gate = gates.find((candidate) => candidate.x === state.x && candidate.y === state.y)
  if (!gate) {
    setStatus(`${playerNames[player]}: llega a una puerta antes de pulsar SELECT.`)
    return
  }
  if (gate.letter === currentQuestion().correct) {
    positions[player].score += 1
    updateScoreboard()
    setStatus(`¡Correcto, ${playerNames[player]}! +1 punto.`, 'good')
    if (navigator.vibrate) navigator.vibrate(45)
    showRoundFeedback()
  } else {
    wrongAttempts.push({ player, answer: gate.letter })
    positions[player].frozenUntil = Date.now() + 3000
    gameState = 'active'
    setStatus(`La puerta ${gate.letter} no es. ${playerNames[player]} queda en pausa 3 segundos.`, 'bad')
    if (navigator.vibrate) navigator.vibrate([60, 35, 60])
    feedbackTimeout = window.setTimeout(() => {
      if (gameState === 'active') setStatus('La pausa terminó. ¡Sigan buscando la puerta correcta!')
    }, 3000)
  }
}

function showRoundFeedback(): void {
  window.clearInterval(timerInterval)
  window.clearTimeout(feedbackTimeout)
  gameState = 'feedback'
  const question = currentQuestion()
  const attempts = element('incorrect-review')
  element('feedback-kicker').textContent = `RETROALIMENTACIÓN · RONDA ${question.id} DE 10`
  element('feedback-title').textContent = wrongAttempts.length ? 'Revisemos las respuestas' : 'Respuesta de la ronda'
  if (wrongAttempts.length) {
    attempts.innerHTML = wrongAttempts.map(({ player, answer }) =>
      `<div class="review-attempt"><span class="review-player">${escapeHtml(playerNames[player])}</span><b>Opción ${answer}</b><span>${escapeHtml(question.options[answer])}</span></div>`,
    ).join('')
  } else {
    attempts.innerHTML = `<p class="review-empty">${timeExpired ? 'Se agotó el tiempo sin una respuesta correcta.' : 'No hubo respuestas incorrectas en esta ronda.'}</p>`
  }
  element('feedback-correct-key').textContent = question.correct
  element('feedback-correct-text').textContent = question.options[question.correct]
  element('feedback-rationale').textContent = feedbackByQuestion[question.id]
  element('continue-round').textContent = questionIndex === questions.length - 1 ? 'Ver resultado final' : 'Siguiente pregunta'
  element('feedback-overlay').classList.remove('hidden')
  setStatus('Revisen la respuesta antes de continuar.')
}

function advanceQuestion(): void {
  window.clearTimeout(feedbackTimeout)
  if (gameState !== 'feedback') return
  element('feedback-overlay').classList.add('hidden')
  if (questionIndex >= questions.length - 1) {
    finishGame()
    return
  }
  questionIndex += 1
  wrongAttempts = []
  timeExpired = false
  gameState = 'active'
  resetPlayers()
  renderQuestion()
  setStatus('Nueva pregunta. ¡A encontrar la puerta!')
  startTimer()
}

function finishGame(): void {
  window.clearInterval(timerInterval)
  gameState = 'finished'
  element('feedback-overlay').classList.add('hidden')
  const first = positions[0].score
  const second = positions[1].score
  const winner = first === second ? null : first > second ? playerNames[0] : playerNames[1]
  const record: MatchRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    completedAt: new Date().toISOString(),
    players: [{ name: playerNames[0], score: first }, { name: playerNames[1], score: second }],
    winner,
  }
  matches.push(record)
  lastSaveSucceeded = saveMatches()
  element('result-title').textContent = winner ? `¡Ganó ${winner}!` : '¡Un empate en equipo!'
  element('result-summary').textContent = winner ? 'La constancia abrió la puerta correcta.' : 'Terminaron con el mismo puntaje.'
  element('result-name-one').textContent = playerNames[0]
  element('result-name-two').textContent = playerNames[1]
  element('result-score-one').textContent = String(first)
  element('result-score-two').textContent = String(second)
  element('save-confirmation').textContent = lastSaveSucceeded
    ? 'Partida guardada en este dispositivo.'
    : 'No se pudo guardar. Exporta el reporte o revisa el espacio disponible.'
  element('result-overlay').classList.remove('hidden')
  refreshSetupStats()
}

function showRecords(): void {
  recordsReturnScreen = currentScreen
  renderRecords()
  setScreen('records')
}

function closeRecords(): void {
  setScreen(recordsReturnScreen)
}

function renderRecords(): void {
  const byPlayer = new Map<string, { name: string; games: number; wins: number; points: number }>()
  for (const match of matches) {
    for (const player of match.players) {
      const key = normalizeName(player.name)
      const total = byPlayer.get(key) ?? { name: player.name, games: 0, wins: 0, points: 0 }
      total.games += 1
      total.points += player.score
      if (match.winner && normalizeName(match.winner) === key) total.wins += 1
      byPlayer.set(key, total)
    }
  }
  const ranking = [...byPlayer.values()].sort((a, b) => b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name, 'es'))
  const appearances = matches.reduce((sum, match) => sum + match.players.length, 0)
  element('stat-matches').textContent = String(matches.length)
  element('stat-people').textContent = String(byPlayer.size)
  element('stat-appearances').textContent = String(appearances)
  element('stat-leader').textContent = ranking[0]?.name ?? '—'
  element('stat-leader-wins').textContent = ranking.length ? `${ranking[0].wins} victorias` : 'sin victorias todavía'
  element('ranking-count').textContent = `${ranking.length} ${ranking.length === 1 ? 'jugador' : 'jugadores'}`
  element('ranking-body').innerHTML = ranking.length
    ? ranking.map((player, index) => `<tr><td><span class="rank-number">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(player.name)}</strong></td><td>${player.games}</td><td><b class="wins-value">${player.wins}</b></td><td>${player.points}</td></tr>`).join('')
    : '<tr><td class="empty-table" colspan="4">Las partidas completadas aparecerán aquí.</td></tr>'
  const history = [...matches].reverse()
  element('history-count').textContent = `${matches.length} ${matches.length === 1 ? 'registro' : 'registros'}`
  element('history-list').innerHTML = history.length
    ? history.map((match) => {
      const winnerLabel = match.winner ? `Ganó ${escapeHtml(match.winner)}` : 'Empate'
      return `<article class="history-row"><div class="history-date">${new Date(match.completedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</div><div class="history-match"><span>${escapeHtml(match.players[0].name)} <b>${match.players[0].score}</b></span><i>:</i><span>${escapeHtml(match.players[1].name)} <b>${match.players[1].score}</b></span></div><div class="history-winner">${winnerLabel}</div></article>`
    }).join('')
    : '<div class="empty-history">Aún no hay partidas completadas.</div>'
}

function refreshSetupStats(): void {
  element('setup-match-count').textContent = String(matches.length)
}

function csvCell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

function exportCsv(): void {
  if (!matches.length) {
    window.alert('Todavía no hay partidas para exportar.')
    return
  }
  const rows = [
    ['Fecha', 'Jugador 1', 'Puntaje 1', 'Jugador 2', 'Puntaje 2', 'Ganador'],
    ...matches.map((match) => [
      new Date(match.completedAt).toLocaleString('es-CO'),
      match.players[0].name,
      match.players[0].score,
      match.players[1].name,
      match.players[1].score,
      match.winner ?? 'Empate',
    ]),
  ]
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `sena-team-challenge-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.append(link)
  link.click()
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
    link.remove()
  }, 1000)
}

function setupControls(): void {
  const form = element<HTMLFormElement>('players-form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const first = element<HTMLInputElement>('player-one').value.trim()
    const second = element<HTMLInputElement>('player-two').value.trim()
    const error = element('form-error')
    if (!first || !second) {
      error.textContent = 'Escriban el nombre de ambos jugadores.'
      return
    }
    if (normalizeName(first) === normalizeName(second)) {
      error.textContent = 'Cada jugador necesita un nombre diferente.'
      element<HTMLInputElement>('player-two').focus()
      return
    }
    error.textContent = ''
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    startGame([first.slice(0, 20), second.slice(0, 20)])
  })

  const holds = new Map<HTMLButtonElement, number>()
  document.querySelectorAll<HTMLButtonElement>('.pad-key').forEach((button) => {
    const player = Number(button.closest('.dpad')?.getAttribute('data-player')) as PlayerId
    const direction = button.dataset.direction as Direction
    const stop = () => {
      const timer = holds.get(button)
      if (timer !== undefined) window.clearInterval(timer)
      holds.delete(button)
    }
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      button.setPointerCapture(event.pointerId)
      stop()
      movePlayer(player, direction)
      holds.set(button, window.setInterval(() => movePlayer(player, direction), 165))
    })
    button.addEventListener('pointerup', stop)
    button.addEventListener('pointercancel', stop)
    button.addEventListener('lostpointercapture', stop)
    button.addEventListener('contextmenu', (event) => event.preventDefault())
  })

  document.querySelectorAll<HTMLButtonElement>('[data-select]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      selectGate(Number(button.dataset.select) as PlayerId)
    })
  })

  const keyboard: Record<string, [PlayerId, Direction]> = {
    ArrowUp: [0, 'up'], ArrowDown: [0, 'down'], ArrowLeft: [0, 'left'], ArrowRight: [0, 'right'],
    w: [1, 'up'], s: [1, 'down'], a: [1, 'left'], d: [1, 'right'],
    W: [1, 'up'], S: [1, 'down'], A: [1, 'left'], D: [1, 'right'],
  }
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return
    const move = keyboard[event.key]
    if (!move) return
    event.preventDefault()
    movePlayer(move[0], move[1])
  })

  element('open-records').addEventListener('click', showRecords)
  element('setup-view-records').addEventListener('click', showRecords)
  element('game-records').addEventListener('click', showRecords)
  element('result-records').addEventListener('click', showRecords)
  element('records-back').addEventListener('click', closeRecords)
  element('export-csv').addEventListener('click', exportCsv)
  element('clear-records').addEventListener('click', () => {
    if (!matches.length || !window.confirm('¿Borrar todo el historial guardado en este dispositivo? Esta acción no se puede deshacer.')) return
    matches = []
    lastSaveSucceeded = saveMatches()
    refreshSetupStats()
    renderRecords()
  })
  element('play-again').addEventListener('click', () => startGame())
  element('continue-round').addEventListener('click', advanceQuestion)
  element('result-home').addEventListener('click', () => {
    gameState = 'setup'
    setScreen('setup')
    refreshSetupStats()
  })
  element('leave-game').addEventListener('click', () => {
    if (gameState === 'active' && !window.confirm('¿Salir de la partida? Solo se guardan las partidas completadas.')) return
    window.clearInterval(timerInterval)
    window.clearTimeout(feedbackTimeout)
    gameState = 'setup'
    setScreen('setup')
  })
  window.addEventListener('resize', updateOrientationNotice)
  window.addEventListener('orientationchange', updateOrientationNotice)
  updateOrientationNotice()
  refreshSetupStats()
}

function updateOrientationNotice(): void {
  const portrait = window.matchMedia('(orientation: portrait)').matches
  element('rotate-warning').classList.toggle('hidden', !portrait || currentScreen !== 'game' || gameState === 'finished')
}

class MazeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics
  private gateLabels: Phaser.GameObjects.Text[] = []
  private playerLabels: Phaser.GameObjects.Text[] = []
  private tileSize = 32
  private offsetX = 0
  private offsetY = 0

  constructor() {
    super('Maze')
  }

  create(): void {
    mazeScene = this
    this.graphics = this.add.graphics()
    this.gateLabels = gates.map((gate) => this.add.text(0, 0, gate.letter, {
      fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5, 0.5))
    this.playerLabels = [0, 1].map(() => this.add.text(0, 0, '', {
      fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontStyle: '700', color: '#ffffff',
      backgroundColor: '#16482f', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1))
    this.scale.on('resize', () => this.redraw())
    this.redraw()
  }

  resetPositions(): void {
    positions[0].x = 0
    positions[0].y = 4
    positions[0].frozenUntil = 0
    positions[1].x = 16
    positions[1].y = 4
    positions[1].frozenUntil = 0
    this.redraw()
  }

  redraw(): void {
    if (!this.graphics) return
    const width = this.scale.width
    const height = this.scale.height
    this.tileSize = Math.max(12, Math.min((width - 20) / 17, (height - 20) / 9))
    this.offsetX = (width - this.tileSize * 17) / 2
    this.offsetY = (height - this.tileSize * 9) / 2
    const g = this.graphics
    g.clear()
    g.fillStyle(0x244f37, 1)
    g.fillRect(0, 0, width, height)
    g.fillStyle(0x326b45, 0.34)
    for (let i = 0; i < 16; i += 1) {
      const x = (i * 83 + 17) % Math.max(1, width)
      const y = (i * 47 + 13) % Math.max(1, height)
      g.fillCircle(x, y, Math.max(2, this.tileSize * 0.13))
    }
    for (let row = 0; row < mazeRows.length; row += 1) {
      for (let col = 0; col < mazeRows[row].length; col += 1) {
        const x = this.offsetX + col * this.tileSize
        const y = this.offsetY + row * this.tileSize
        if (mazeRows[row][col] === '.') {
          g.fillStyle(0xcdb57b, 0.38)
          g.fillRoundedRect(x + 1, y + 2, this.tileSize - 2, this.tileSize - 2, Math.max(3, this.tileSize * 0.15))
          g.fillStyle(0xead8a5, 1)
          g.fillRoundedRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 3, Math.max(3, this.tileSize * 0.15))
          if ((row + col) % 4 === 0) {
            g.fillStyle(0xd7c18e, 0.42)
            g.fillCircle(x + this.tileSize * 0.72, y + this.tileSize * 0.3, Math.max(1, this.tileSize * 0.04))
          }
        } else {
          g.fillStyle(0x16472f, 1)
          g.fillRoundedRect(x + 1, y + 2, this.tileSize - 2, this.tileSize - 2, Math.max(3, this.tileSize * 0.22))
          g.fillStyle(0x287446, 1)
          g.fillRoundedRect(x + 1, y + 1, this.tileSize - 3, this.tileSize - 4, Math.max(3, this.tileSize * 0.22))
          g.fillStyle(0x55a14b, 0.8)
          g.fillCircle(x + this.tileSize * 0.3, y + this.tileSize * 0.35, this.tileSize * 0.12)
          g.fillCircle(x + this.tileSize * 0.66, y + this.tileSize * 0.62, this.tileSize * 0.1)
        }
      }
    }
    gates.forEach((gate, index) => {
      const x = this.offsetX + gate.x * this.tileSize
      const y = this.offsetY + gate.y * this.tileSize
      const gateWidth = this.tileSize * 0.78
      const gateX = x + (this.tileSize - gateWidth) / 2
      const gateHeight = this.tileSize * 0.84
      g.fillStyle(0x243b2b, 0.35)
      g.fillRoundedRect(gateX - 1, y + this.tileSize * 0.1, gateWidth + 2, gateHeight, Math.max(4, this.tileSize * 0.28))
      g.fillStyle(gate.color, 1)
      g.fillRoundedRect(gateX, y + this.tileSize * 0.05, gateWidth, gateHeight, Math.max(4, this.tileSize * 0.27))
      g.fillStyle(0x193b2a, 1)
      g.fillRoundedRect(gateX + gateWidth * 0.2, y + this.tileSize * 0.34, gateWidth * 0.6, gateHeight * 0.66, Math.max(3, this.tileSize * 0.18))
      g.fillStyle(0xf4e7c2, 1)
      g.fillCircle(gateX + gateWidth / 2, y + this.tileSize * 0.24, Math.max(2, this.tileSize * 0.05))
      const letter = this.gateLabels[index]
      letter.setFontSize(Math.max(10, this.tileSize * 0.34))
      letter.setPosition(gateX + gateWidth / 2, y + this.tileSize * 0.19)
      const occupied = positions.some((position) => position.x === gate.x && position.y === gate.y)
      if (occupied) {
        g.lineStyle(Math.max(2, this.tileSize * 0.06), 0xfff0a6, 1)
        g.strokeRoundedRect(gateX - 2, y + this.tileSize * 0.02, gateWidth + 4, gateHeight + 3, Math.max(4, this.tileSize * 0.28))
      }
    })
    positions.forEach((position, index) => {
      const centerX = this.offsetX + (position.x + 0.5) * this.tileSize
      const centerY = this.offsetY + (position.y + 0.54) * this.tileSize
      const radius = this.tileSize * 0.28
      const bodyColor = index === 0 ? 0x39a900 : 0x8e9d39
      g.fillStyle(0x1a3b29, 0.35)
      g.fillEllipse(centerX, centerY + radius * 0.7, radius * 2.2, radius * 0.5)
      g.fillStyle(bodyColor, 1)
      g.fillRoundedRect(centerX - radius * 0.58, centerY - radius * 0.05, radius * 1.16, radius * 1.35, radius * 0.3)
      g.lineStyle(1.5, 0x173b29, 1)
      g.strokeRoundedRect(centerX - radius * 0.58, centerY - radius * 0.05, radius * 1.16, radius * 1.35, radius * 0.3)
      g.fillStyle(index === 0 ? 0xd79c6d : 0xb87951, 1)
      g.fillCircle(centerX, centerY - radius * 0.42, radius * 0.45)
      g.fillStyle(0x17472f, 1)
      g.fillRoundedRect(centerX - radius * 0.52, centerY - radius * 0.82, radius * 1.04, radius * 0.26, radius * 0.12)
      g.fillStyle(index === 0 ? 0xd4e9b3 : 0xe9e5ba, 1)
      g.fillCircle(centerX + radius * 0.16, centerY - radius * 0.44, Math.max(1, radius * 0.07))
      const nameLabel = this.playerLabels[index]
      nameLabel.setText(playerNames[index])
      nameLabel.setFontSize(Math.max(8, Math.min(12, this.tileSize * 0.25)))
      nameLabel.setPosition(centerX, centerY - radius * 0.9)
      nameLabel.setBackgroundColor(Date.now() < position.frozenUntil ? '#8b4e3b' : index === 0 ? '#176438' : '#68762f')
    })
    if (gameState === 'setup') g.setAlpha(1)
  }
}

setupControls()
window.addEventListener('orientationchange', updateOrientationNotice)