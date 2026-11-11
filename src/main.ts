import Phaser from 'phaser'
import {
  fetchSharedMatches,
  sharedMatchesConfigured,
  uploadMatches,
} from './shared-matches'
import type { MatchAnswer, MatchRecord, MatchWinner } from './shared-matches'

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
const collaborationAreas = [
  { name: 'Diálogo y escucha', questions: [1, 3, 4, 5] },
  { name: 'Planeación en equipo', questions: [2, 6, 9] },
  { name: 'Responsabilidad y diversidad', questions: [7, 8, 10] },
]

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

let localMatches = loadMatches()
let matches = [...localMatches]
let gameState: GameState = 'setup'
let currentScreen: ScreenName = 'setup'
let recordsReturnScreen: ScreenName = 'setup'
let questionIndex = 0
let secondsLeft = 45
let timerInterval: number | undefined
let feedbackTimeout: number | undefined
let wrongAttempts: { player: PlayerId; answer: OptionKey }[] = []
let matchAnswers: MatchAnswer[] = []
let timeExpired = false
let game: Phaser.Game | undefined
let mazeScene: MazeScene | undefined
let lastSaveSucceeded = true
let refreshInProgress = false
let detailsReturnToResults = false

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
    return saved.flatMap((entry: unknown): MatchRecord[] => {
      if (!entry || typeof entry !== 'object') return []
      const match = entry as Record<string, unknown>
      if (typeof match.id !== 'string' || typeof match.completedAt !== 'string' ||
        !Array.isArray(match.players) || match.players.length !== 2) return []
      const [first, second] = match.players
      if (!first || typeof first !== 'object' || !second || typeof second !== 'object') return []
      const playerOne = first as Record<string, unknown>
      const playerTwo = second as Record<string, unknown>
      if (typeof playerOne.name !== 'string' || typeof playerOne.score !== 'number' ||
        typeof playerTwo.name !== 'string' || typeof playerTwo.score !== 'number') return []
      const winner: MatchWinner = match.winner === null
        ? null
        : match.winner === 0 || match.winner === 1
          ? match.winner
          : typeof match.winner === 'string'
            ? match.winner === playerOne.name ? 0 : match.winner === playerTwo.name ? 1 : null
            : null
      const answers = Array.isArray(match.answers)
        ? match.answers.filter((answer): answer is MatchAnswer =>
          Boolean(answer && typeof answer === 'object' &&
            'questionId' in answer && typeof answer.questionId === 'number' &&
            'player' in answer && (answer.player === 0 || answer.player === 1) &&
            'selected' in answer && ['A', 'B', 'C', 'D'].includes(String(answer.selected))),
        )
        : null
      return [{
        id: match.id,
        completedAt: match.completedAt,
        players: [
          { name: playerOne.name, score: playerOne.score },
          { name: playerTwo.name, score: playerTwo.score },
        ],
        winner,
        answers,
      }]
    })
  } catch {
    return []
  }
}

function saveLocalMatches(): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(localMatches))
    return true
  } catch {
    return false
  }
}

function mergeMatches(...collections: MatchRecord[][]): MatchRecord[] {
  const byId = new Map<string, MatchRecord>()
  for (const collection of collections) {
    for (const match of collection) byId.set(match.id, match)
  }
  return [...byId.values()].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
}

function setScreen(screen: ScreenName): void {
  currentScreen = screen
  element('setup-screen').classList.toggle('hidden', screen !== 'setup')
  element('game-screen').classList.toggle('hidden', screen !== 'game')
  element('records-screen').classList.toggle('hidden', screen !== 'records')
  if (screen === 'game') refreshGameLayout()
}

function refreshGameLayout(): void {
  const activeGame = game
  if (!activeGame || currentScreen !== 'game') return

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (game !== activeGame || currentScreen !== 'game') return
      activeGame.scale.refresh()
      mazeScene?.redraw()
    })
  })
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
  matchAnswers = []
  timeExpired = false
  resetPlayers()
  gameState = 'active'
  element('feedback-overlay').classList.add('hidden')
  element('result-overlay').classList.add('hidden')
  setScreen('game')
  renderQuestion()
  updateScoreboard()
  setStatus('Alcanza una puerta y pulsa SELECT para confirmar.')
  startTimer()
  ensureGame()
  refreshGameLayout()
}

function ensureGame(): void {
  if (game) return
  const newGame = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'maze-root',
    backgroundColor: '#245a3c',
    scale: { mode: Phaser.Scale.RESIZE, width: 680, height: 360 },
    render: { antialias: true, pixelArt: false, roundPixels: true },
    scene: [MazeScene],
    audio: { noAudio: true },
  })
  game = newGame
  newGame.events.once(Phaser.Core.Events.READY, refreshGameLayout)
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
  matchAnswers.push({ questionId: currentQuestion().id, player, selected: gate.letter })
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
  const winner: MatchWinner = first === second ? null : first > second ? 0 : 1
  const record: MatchRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    completedAt: new Date().toISOString(),
    players: [{ name: playerNames[0], score: first }, { name: playerNames[1], score: second }],
    winner,
    answers: [...matchAnswers],
  }
  localMatches.push(record)
  matches = mergeMatches(matches, [record])
  lastSaveSucceeded = saveLocalMatches()
  element('result-title').textContent = winner !== null ? `¡Ganó ${playerNames[winner]}!` : '¡Un empate en equipo!'
  element('result-summary').textContent = winner !== null ? 'La constancia abrió la puerta correcta.' : 'Terminaron con el mismo puntaje.'
  element('result-name-one').textContent = playerNames[0]
  element('result-name-two').textContent = playerNames[1]
  element('result-score-one').textContent = String(first)
  element('result-score-two').textContent = String(second)
  element<HTMLButtonElement>('result-details-one').dataset.matchId = record.id
  element<HTMLButtonElement>('result-details-two').dataset.matchId = record.id
  element('save-confirmation').textContent = lastSaveSucceeded
    ? sharedMatchesConfigured ? 'Guardada en este dispositivo. Sincronizando con el reporte público…' : 'Partida guardada en este dispositivo.'
    : 'No se pudo guardar en este dispositivo. Revisa el espacio disponible.'
  element('result-overlay').classList.remove('hidden')
  refreshSetupStats()
  if (sharedMatchesConfigured) void publishMatch(record)
}

async function publishMatch(record: MatchRecord): Promise<void> {
  try {
    await uploadMatches([record])
    element('save-confirmation').textContent = 'Partida guardada y visible en el reporte público.'
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido.'
    element('save-confirmation').textContent = `Guardada solo en este dispositivo; no se pudo compartir. ${detail}`
  }
}

function showRecords(): void {
  recordsReturnScreen = currentScreen
  if (sharedMatchesConfigured) matches = []
  renderRecords()
  setScreen('records')
  void refreshRecords()
}

function closeRecords(): void {
  setScreen(recordsReturnScreen)
}

function getFilteredMatches(): MatchRecord[] {
  const startValue = element<HTMLInputElement>('filter-start').value
  const endValue = element<HTMLInputElement>('filter-end').value
  const selectedPlayer = element<HTMLSelectElement>('filter-player').value
  const startTime = startValue ? new Date(`${startValue}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY
  const endDate = endValue ? new Date(`${endValue}T00:00:00`) : undefined
  if (endDate) endDate.setDate(endDate.getDate() + 1)
  const endTime = endDate?.getTime() ?? Number.POSITIVE_INFINITY
  return matches.filter((match) => {
    const completedAt = new Date(match.completedAt).getTime()
    const inDateRange = completedAt >= startTime && completedAt < endTime
    const hasPlayer = !selectedPlayer || match.players.some((player) => normalizeName(player.name) === selectedPlayer)
    return inDateRange && hasPlayer
  })
}

function updatePlayerFilter(): void {
  const playerFilter = element<HTMLSelectElement>('filter-player')
  const selected = playerFilter.value
  const players = new Map<string, string>()
  matches.forEach((match) => match.players.forEach((player) => {
    const key = normalizeName(player.name)
    if (!players.has(key)) players.set(key, player.name)
  }))
  playerFilter.innerHTML = '<option value="">Todos los jugadores</option>' +
    [...players.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'))
      .map(([key, name]) => `<option value="${escapeHtml(key)}">${escapeHtml(name)}</option>`).join('')
  if (players.has(selected)) playerFilter.value = selected
}

function renderReportCharts(filtered: MatchRecord[]): void {
  const selectedPlayer = element<HTMLSelectElement>('filter-player').value
  const playerLabel = selectedPlayer ? element<HTMLSelectElement>('filter-player').selectedOptions[0]?.textContent : null
  const startValue = element<HTMLInputElement>('filter-start').value
  const endValue = element<HTMLInputElement>('filter-end').value
  const dates = filtered.map((match) => new Date(match.completedAt)).filter((date) => !Number.isNaN(date.getTime()))
  const firstMatchTime = dates.reduce((minimum, date) => Math.min(minimum, date.getTime()), Number.POSITIVE_INFINITY)
  const lastMatchTime = dates.reduce((maximum, date) => Math.max(maximum, date.getTime()), Number.NEGATIVE_INFINITY)
  let firstDay: Date
  let lastDay: Date
  if (startValue || endValue) {
    firstDay = startValue ? new Date(`${startValue}T00:00:00`) : new Date(Number.isFinite(firstMatchTime) ? firstMatchTime : Date.now())
    lastDay = endValue ? new Date(`${endValue}T00:00:00`) : new Date(Number.isFinite(lastMatchTime) ? lastMatchTime : Date.now())
  } else if (dates.length) {
    firstDay = new Date(firstMatchTime)
    lastDay = new Date(lastMatchTime)
  } else {
    lastDay = new Date()
    firstDay = new Date()
    firstDay.setDate(firstDay.getDate() - 6)
  }
  firstDay.setHours(0, 0, 0, 0)
  lastDay.setHours(0, 0, 0, 0)
  const spanDays = Math.max(1, Math.floor((lastDay.getTime() - firstDay.getTime()) / 86_400_000) + 1)
  const bucketSize = Math.max(1, Math.ceil(spanDays / 7))
  const bucketCount = Math.min(7, Math.ceil(spanDays / bucketSize))
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = new Date(firstDay)
    start.setDate(start.getDate() + index * bucketSize)
    const end = new Date(start)
    end.setDate(start.getDate() + Math.min(bucketSize, spanDays - index * bucketSize) - 1)
    return { start, end, count: 0 }
  })
  for (const match of filtered) {
    const matchDate = new Date(match.completedAt)
    matchDate.setHours(0, 0, 0, 0)
    const dayIndex = Math.floor((matchDate.getTime() - firstDay.getTime()) / 86_400_000)
    const bucketIndex = Math.floor(dayIndex / bucketSize)
    if (buckets[bucketIndex]) buckets[bucketIndex].count += 1
  }
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count))
  element('matches-chart-caption').textContent = `${filtered.length} ${filtered.length === 1 ? 'partida' : 'partidas'}`
  element('matches-chart').innerHTML = filtered.length ? buckets.map((bucket) => {
    const label = bucket.start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    const rangeLabel = bucket.start.getTime() === bucket.end.getTime()
      ? label
      : `${label} – ${bucket.end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
    const height = bucket.count ? Math.max(8, Math.round(bucket.count / maxCount * 100)) : 0
    return `<div class="bar-column" aria-label="${rangeLabel}: ${bucket.count} partidas"><span>${bucket.count || ''}</span><div class="bar-track"><i style="height:${height}%"></i></div><small>${rangeLabel}</small></div>`
  }).join('') : '<p class="chart-empty">No hay partidas para este filtro.</p>'

  const categoryResults = (['Formativa', 'Laboral'] as const).map((category) => {
    const questionIds = new Set(questions.filter((question) => question.category === category).map((question) => question.id))
    let correct = 0
    let answered = 0
    for (const match of filtered) {
      match.players.forEach((_, playerIndex) => {
        if (selectedPlayer && normalizeName(match.players[playerIndex].name) !== selectedPlayer) return
        const responses = (match.answers ?? []).filter((answer) => answer.player === playerIndex && questionIds.has(answer.questionId))
        for (const questionId of questionIds) {
          const attempts = responses.filter((answer) => answer.questionId === questionId)
          if (!attempts.length) continue
          answered += 1
          const question = questions.find((entry) => entry.id === questionId)
          if (question && attempts.some((answer) => answer.selected === question.correct)) correct += 1
        }
      })
    }
    return { category, correct, answered, percentage: answered ? Math.round(correct / answered * 100) : 0 }
  })
  element('answers-chart-caption').textContent = playerLabel ? `Jugador: ${playerLabel}` : 'Todos los jugadores'
  element('answers-chart').innerHTML = categoryResults.some((result) => result.answered) ? categoryResults.map((result) =>
    `<div class="category-bar"><div><span>${result.category}</span><strong>${result.answered ? `${result.percentage}%` : 'Sin datos'}</strong></div><div class="category-track"><i style="width:${result.percentage}%"></i></div><small>${result.correct} aciertos de ${result.answered} respuestas</small></div>`,
  ).join('') : '<p class="chart-empty">No hay respuestas guardadas para este filtro.</p>'
}

function renderRecords(): void {
  updatePlayerFilter()
  const filteredMatches = getFilteredMatches()
  const selectedPlayer = element<HTMLSelectElement>('filter-player').value
  const byPlayer = new Map<string, { name: string; games: number; wins: number; points: number }>()
  for (const match of filteredMatches) {
    match.players.forEach((player, playerIndex) => {
      if (selectedPlayer && normalizeName(player.name) !== selectedPlayer) return
      const key = normalizeName(player.name)
      const total = byPlayer.get(key) ?? { name: player.name, games: 0, wins: 0, points: 0 }
      total.games += 1
      total.points += player.score
      if (match.winner === playerIndex) total.wins += 1
      byPlayer.set(key, total)
    })
  }
  const ranking = [...byPlayer.values()].sort((a, b) => b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name, 'es'))
  const appearances = filteredMatches.reduce((sum, match) =>
    sum + match.players.filter((player) => !selectedPlayer || normalizeName(player.name) === selectedPlayer).length, 0)
  element('stat-matches').textContent = String(filteredMatches.length)
  element('stat-people').textContent = String(byPlayer.size)
  element('stat-appearances').textContent = String(appearances)
  element('stat-leader').textContent = ranking[0]?.name ?? '—'
  element('stat-leader-wins').textContent = ranking.length ? `${ranking[0].wins} victorias` : 'sin victorias todavía'
  element('ranking-count').textContent = `${ranking.length} ${ranking.length === 1 ? 'nombre' : 'nombres'}`
  element('ranking-body').innerHTML = ranking.length
    ? ranking.map((player, index) => `<tr><td><span class="rank-number">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(player.name)}</strong></td><td>${player.games}</td><td><b class="wins-value">${player.wins}</b></td><td>${player.points}</td></tr>`).join('')
    : '<tr><td class="empty-table" colspan="4">Las partidas completadas aparecerán aquí.</td></tr>'
  const history = [...filteredMatches].reverse()
  element('history-count').textContent = `${filteredMatches.length} ${filteredMatches.length === 1 ? 'registro' : 'registros'}`
  element('history-list').innerHTML = history.length
    ? history.map((match) => {
      const winnerLabel = match.winner !== null ? `Ganó ${escapeHtml(match.players[match.winner].name)}` : 'Empate'
      const detailsLabel = match.answers !== null ? 'Ver resultados' : 'Detalle no disponible para esta partida'
      return `<article class="history-row"><div class="history-date">${new Date(match.completedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</div><div class="history-match"><button class="history-player" type="button" data-match-id="${escapeHtml(match.id)}" data-player="0" aria-label="${detailsLabel}: ${escapeHtml(match.players[0].name)}"><span class="history-player-name">${escapeHtml(match.players[0].name)}</span><b>${match.players[0].score}</b><small>Ver detalle</small></button><i>:</i><button class="history-player" type="button" data-match-id="${escapeHtml(match.id)}" data-player="1" aria-label="${detailsLabel}: ${escapeHtml(match.players[1].name)}"><span class="history-player-name">${escapeHtml(match.players[1].name)}</span><b>${match.players[1].score}</b><small>Ver detalle</small></button></div><div class="history-winner">${winnerLabel}</div></article>`
    }).join('')
    : '<div class="empty-history">Aún no hay partidas completadas.</div>'
  renderReportCharts(filteredMatches)
}

function showMatchDetails(match: MatchRecord, playerIndex: PlayerId, returnToResults: boolean): void {
  detailsReturnToResults = returnToResults
  if (returnToResults) element('result-overlay').classList.add('hidden')
  const player = match.players[playerIndex]
  element('match-details-title').textContent = `Resultados de ${player.name}`
  const summary = element('match-details-summary')
  const insights = element('match-details-insights')
  const body = element('match-details-body')

  if (match.answers === null) {
    summary.textContent = 'Esta partida no guardó el detalle de las respuestas. Las partidas anteriores a esta función no se pueden reconstruir.'
    insights.replaceChildren()
    body.replaceChildren()
  } else {
    const playerAnswers = match.answers.filter((answer) => answer.player === playerIndex)
    const categories = (['Formativa', 'Laboral'] as const).map((category) => {
      const categoryQuestions = questions.filter((question) => question.category === category)
      const correct = categoryQuestions.filter((question) =>
        playerAnswers.some((answer) => answer.questionId === question.id && answer.selected === question.correct),
      ).length
      const answered = categoryQuestions.filter((question) =>
        playerAnswers.some((answer) => answer.questionId === question.id),
      ).length
      return { category, correct, answered }
    })
    summary.textContent = `Decisiones formativas: ${categories[0].correct} aciertos de ${categories[0].answered} respondidas. Decisiones laborales: ${categories[1].correct} aciertos de ${categories[1].answered} respondidas. Esto resume tus elecciones de esta partida; no define quién eres.`
    const outcomes = questions.map((question) => {
      const attempts = playerAnswers.filter((answer) => answer.questionId === question.id)
      return { question, answered: attempts.length > 0, correct: attempts.some((answer) => answer.selected === question.correct) }
    })
    const areaScores = collaborationAreas.map((area) => {
      const responses = outcomes.filter((entry) => area.questions.includes(entry.question.id) && entry.answered)
      return { ...area, answered: responses.length, correct: responses.filter((entry) => entry.correct).length }
    }).filter((area) => area.answered >= 2)
    if (!areaScores.length) {
      insights.innerHTML = '<p class="insight-empty">No hay suficientes respuestas registradas para sugerir fortalezas o temas de práctica.</p>'
    } else {
      const strengths = [...areaScores].sort((a, b) => b.correct / b.answered - a.correct / a.answered)[0]
      const practice = [...areaScores].filter((area) => area.correct < area.answered)
        .sort((a, b) => a.correct / a.answered - b.correct / b.answered)[0]
      const strengthText = `En esta partida resolviste colaborativamente ${strengths.correct} de ${strengths.answered} situaciones de ${strengths.name.toLocaleLowerCase('es')}.`
      const practiceText = practice
        ? `Puedes seguir practicando ${practice.name.toLocaleLowerCase('es')}: revisa la retroalimentación de las preguntas de este tema.`
        : 'En las áreas con respuestas registradas elegiste las alternativas colaborativas. ¡Sigue poniendo esas ideas en práctica!'
      insights.innerHTML = `<article class="insight-card insight-strength"><strong>Fortaleza observada</strong><p>${strengthText}</p></article><article class="insight-card insight-practice"><strong>Para seguir practicando</strong><p>${practiceText}</p></article>`
    }
    body.innerHTML = questions.map((question) => {
      const attempts = playerAnswers.filter((answer) => answer.questionId === question.id)
      const correct = attempts.some((answer) => answer.selected === question.correct)
      const selection = attempts.length
        ? attempts.map((answer) => `${answer.selected}: ${escapeHtml(question.options[answer.selected])}`).join(' → ')
        : 'No respondió antes de terminar la ronda.'
      const result = correct ? 'Acertaste' : attempts.length ? 'Para reflexionar' : 'Sin respuesta'
      return `<article class="detail-question"><div class="detail-question-heading"><span>${question.category} · Pregunta ${question.id}</span><b class="${correct ? 'detail-correct' : 'detail-reflection'}">${result}</b></div><h3>${escapeHtml(question.question)}</h3><p><strong>Tu elección:</strong> ${selection}</p><p><strong>Respuesta colaborativa:</strong> ${question.correct}: ${escapeHtml(question.options[question.correct])}</p><p class="detail-rationale">${escapeHtml(feedbackByQuestion[question.id])}</p></article>`
    }).join('')
  }
  element('match-details-overlay').classList.remove('hidden')
}

function closeMatchDetails(): void {
  element('match-details-overlay').classList.add('hidden')
  if (detailsReturnToResults) element('result-overlay').classList.remove('hidden')
}

async function refreshRecords(): Promise<void> {
  const status = element('report-sync-status')
  const refreshButton = element<HTMLButtonElement>('refresh-records')
  if (!sharedMatchesConfigured) {
    status.textContent = 'Reporte local: configura Supabase para compartir las partidas entre dispositivos.'
    element('records-device-note').textContent = 'SOLO LOCAL'
    return
  }
  if (refreshInProgress) return
  refreshInProgress = true
  refreshButton.disabled = true
  refreshButton.textContent = 'Actualizando…'
  status.textContent = 'Consultando el reporte público…'
  try {
    const shared = await fetchSharedMatches()
    matches = shared
    renderRecords()
    refreshSetupStats()
    element('records-device-note').textContent = 'REPORTE PÚBLICO'
    status.textContent = `Actualizado: ${new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}.`
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido.'
    status.textContent = `No se pudo actualizar el reporte. ${detail}`
  } finally {
    refreshInProgress = false
    refreshButton.disabled = false
    refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Actualizar'
  }
}

function refreshSetupStats(): void {
  element('setup-match-count').textContent = String(matches.length)
}

async function exportExcel(): Promise<void> {
  const exportMatches = getFilteredMatches()
  if (!exportMatches.length) {
    window.alert('Todavía no hay partidas para exportar.')
    return
  }
  const button = element<HTMLButtonElement>('export-excel')
  button.disabled = true
  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SENA Team Challenge'
    workbook.created = new Date()

    const matchesSheet = workbook.addWorksheet('Partidas', {
      views: [{ state: 'frozen', ySplit: 3 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    })
    matchesSheet.columns = [
      { header: 'Fecha', key: 'date', width: 23 },
      { header: 'Jugador 1', key: 'playerOne', width: 25 },
      { header: 'Puntos 1', key: 'scoreOne', width: 13 },
      { header: 'Jugador 2', key: 'playerTwo', width: 25 },
      { header: 'Puntos 2', key: 'scoreTwo', width: 13 },
      { header: 'Resultado', key: 'result', width: 28 },
    ]
    matchesSheet.mergeCells('A1:F1')
    matchesSheet.getCell('A1').value = 'SENA TEAM CHALLENGE'
    matchesSheet.getCell('A1').font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
    matchesSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF143D2B' } }
    matchesSheet.getCell('A1').alignment = { vertical: 'middle' }
    matchesSheet.getRow(1).height = 34
    matchesSheet.mergeCells('A2:F2')
    matchesSheet.getCell('A2').value = `Reporte de partidas · ${exportMatches.length} registros · Generado ${new Date().toLocaleString('es-CO')}`
    matchesSheet.getCell('A2').font = { name: 'Aptos', size: 10, italic: true, color: { argb: 'FF536B57' } }
    matchesSheet.getRow(2).height = 22
    const headerRow = matchesSheet.getRow(3)
    headerRow.values = ['Fecha', 'Jugador 1', 'Puntos 1', 'Jugador 2', 'Puntos 2', 'Resultado']
    headerRow.height = 24
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF326B45' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    for (const [index, match] of exportMatches.entries()) {
      const row = matchesSheet.addRow([
        new Date(match.completedAt),
        match.players[0].name,
        match.players[0].score,
        match.players[1].name,
        match.players[1].score,
        match.winner !== null ? `Ganó ${match.players[match.winner].name}` : 'Empate',
      ])
      row.height = 22
      row.getCell(1).numFmt = 'dd/mm/yyyy hh:mm'
      row.getCell(1).alignment = { horizontal: 'center' }
      row.getCell(3).alignment = { horizontal: 'center' }
      row.getCell(5).alignment = { horizontal: 'center' }
      row.getCell(6).font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FF326B45' } }
      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFDCE5D4' } } }
        if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6ED' } }
      })
    }
    matchesSheet.autoFilter = { from: 'A3', to: 'F3' }

    const byPlayer = new Map<string, { name: string; games: number; wins: number; points: number }>()
    const selectedPlayer = element<HTMLSelectElement>('filter-player').value
    for (const match of exportMatches) {
      match.players.forEach((player, playerIndex) => {
        if (selectedPlayer && normalizeName(player.name) !== selectedPlayer) return
        const key = normalizeName(player.name)
        const total = byPlayer.get(key) ?? { name: player.name, games: 0, wins: 0, points: 0 }
        total.games += 1
        total.points += player.score
        if (match.winner === playerIndex) total.wins += 1
        byPlayer.set(key, total)
      })
    }
    const ranking = [...byPlayer.values()].sort((a, b) => b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name, 'es'))
    const summarySheet = workbook.addWorksheet('Jugadores', {
      views: [{ state: 'frozen', ySplit: 3 }],
    })
    summarySheet.columns = [
      { header: 'Posición', key: 'position', width: 15 },
      { header: 'Jugador', key: 'name', width: 30 },
      { header: 'Partidas', key: 'games', width: 15 },
      { header: 'Victorias', key: 'wins', width: 15 },
      { header: 'Puntos', key: 'points', width: 15 },
    ]
    summarySheet.mergeCells('A1:E1')
    summarySheet.getCell('A1').value = 'RESUMEN DE JUGADORES'
    summarySheet.getCell('A1').font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
    summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF143D2B' } }
    summarySheet.getCell('A1').alignment = { vertical: 'middle' }
    summarySheet.getRow(1).height = 34
    summarySheet.mergeCells('A2:E2')
    summarySheet.getCell('A2').value = `${ranking.length} nombres · ${exportMatches.length} partidas`
    summarySheet.getCell('A2').font = { name: 'Aptos', size: 10, italic: true, color: { argb: 'FF536B57' } }
    summarySheet.getRow(2).height = 22
    const rankingHeader = summarySheet.getRow(3)
    rankingHeader.values = ['Posición', 'Jugador', 'Partidas', 'Victorias', 'Puntos']
    rankingHeader.height = 24
    rankingHeader.eachCell((cell) => {
      cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF326B45' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    ranking.forEach((player, index) => {
      const row = summarySheet.addRow([index + 1, player.name, player.games, player.wins, player.points])
      row.height = 22
      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFDCE5D4' } } }
        if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6ED' } }
      })
      row.getCell(1).alignment = { horizontal: 'center' }
      row.getCell(4).font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FF326B45' } }
    })
    summarySheet.autoFilter = { from: 'A3', to: 'E3' }

    const buffer = await workbook.xlsx.writeBuffer()
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `sena-team-challenge-${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.append(link)
    link.click()
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
      link.remove()
    }, 1000)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido.'
    window.alert(`No se pudo crear el archivo Excel. ${detail}`)
  } finally {
    button.disabled = false
  }
}

function setupControls(): void {
  element('storage-note').textContent = sharedMatchesConfigured
    ? 'Las partidas se comparten en el reporte público.'
    : 'Resultados guardados en este dispositivo.'
  const form = element<HTMLFormElement>('players-form')
  const playerNameInputs = [element<HTMLInputElement>('player-one'), element<HTMLInputElement>('player-two')]
  playerNameInputs.forEach((input) => {
    input.addEventListener('input', () => {
      const cursor = input.selectionStart
      const beforeCursor = cursor === null ? '' : input.value.slice(0, cursor)
      const cleaned = input.value.replace(/\p{N}/gu, '')
      if (cleaned === input.value) return
      input.value = cleaned
      if (cursor !== null) input.setSelectionRange(beforeCursor.replace(/\p{N}/gu, '').length, beforeCursor.replace(/\p{N}/gu, '').length)
    })
  })
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const first = element<HTMLInputElement>('player-one').value.trim()
    const second = element<HTMLInputElement>('player-two').value.trim()
    const error = element('form-error')
    if (!first || !second) {
      error.textContent = 'Escriban el nombre de ambos jugadores.'
      return
    }
    if (/[\p{N}]/u.test(first) || /[\p{N}]/u.test(second)) {
      error.textContent = 'Los nombres no pueden contener números.'
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

  const keyboardDirections: Record<string, [PlayerId, Direction]> = {
    ArrowUp: [1, 'up'], ArrowDown: [1, 'down'], ArrowLeft: [1, 'left'], ArrowRight: [1, 'right'],
    w: [0, 'up'], s: [0, 'down'], a: [0, 'left'], d: [0, 'right'],
  }
  const keyboardSelect: Record<string, PlayerId> = { f: 0, Enter: 1 }
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || currentScreen !== 'game' || gameState !== 'active') return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const move = keyboardDirections[key]
    if (move) {
      event.preventDefault()
      movePlayer(move[0], move[1])
      return
    }
    const player = keyboardSelect[key]
    if (player !== undefined) {
      event.preventDefault()
      if (!event.repeat) selectGate(player)
    }
  })

  element('open-records').addEventListener('click', showRecords)
  element('setup-view-records').addEventListener('click', showRecords)
  element('result-records').addEventListener('click', showRecords)
  element('records-back').addEventListener('click', closeRecords)
  element('match-details-close').addEventListener('click', closeMatchDetails)
  element('history-list').addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest<HTMLButtonElement>('button[data-match-id][data-player]')
    if (!button) return
    const match = matches.find((entry) => entry.id === button.dataset.matchId)
    const player = Number(button.dataset.player)
    if (match && (player === 0 || player === 1)) showMatchDetails(match, player, false)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-result-player]').forEach((button) => {
    button.addEventListener('click', () => {
      const match = matches.find((entry) => entry.id === button.dataset.matchId)
      const player = Number(button.dataset.resultPlayer)
      if (match && (player === 0 || player === 1)) showMatchDetails(match, player, true)
    })
  })
  element('match-details-overlay').addEventListener('click', (event) => {
    if (event.target === element('match-details-overlay')) closeMatchDetails()
  })
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !element('match-details-overlay').classList.contains('hidden')) closeMatchDetails()
  })
  element('refresh-records').addEventListener('click', () => void refreshRecords())
  for (const id of ['filter-start', 'filter-end', 'filter-player']) element(id).addEventListener('change', renderRecords)
  element('reset-report-filters').addEventListener('click', () => {
    element<HTMLInputElement>('filter-start').value = ''
    element<HTMLInputElement>('filter-end').value = ''
    element<HTMLSelectElement>('filter-player').value = ''
    renderRecords()
  })
  element('export-excel').addEventListener('click', () => void exportExcel())
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
  refreshSetupStats()
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