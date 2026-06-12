import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { SolarSystemScene } from './SolarSystemScene'
import { EarthMoonScene } from './EarthMoonScene'
import { LunarEclipseScene } from './LunarEclipseScene'
import { solarBodies, sunInfo } from './solarSystemData'

const copy = {
  zh: {
    languageLabel: 'Language switcher',
    languageButton: 'English',
    title: '太陽系探索教室',
    controls: '動畫控制',
    pause: '暫停',
    play: '播放',
    speed: '公轉速度',
    stage: '可點選的太陽系模型',
    scene: '立體太陽系模型',
    scaleNote: '拖曳可旋轉視角，滾輪可縮放。示意比例經過調整，方便觀察行星與軌道。',
    facts: {
      order: '位置',
      distance: '距離',
      diameter: '大小',
      mass: '質量',
      composition: '組成',
      rotation: '自轉',
      revolution: '公轉',
      temperature: '溫度',
      moons: '衛星',
    },
    sourceNote: '資料參考 NASA Planetary Fact Sheet 與 NASA Solar System。數值以學習用途做簡化。',
    speedOptions: [
      { label: '慢', value: 0.2 },
      { label: '標準', value: 0.35 },
      { label: '快', value: 1 },
    ],
    detailButton: '進一步認識：月球與潮汐 ▸',
    backButton: '◂ 返回太陽系',
    earthSpinOn: '地球自轉：開',
    earthSpinOff: '地球自轉：關',
    earthMoonScene: '地球與月球立體模型',
    tideType: '地月系統',
    tideTitle: '地球與月球',
    tideIntro: '月球的引力會把地球上的海水「拉」起來，形成潮汐。',
    tidePoints: [
      '面向月球的一側，海水被引力拉起，形成高潮。',
      '背對月球的一側，因為慣性離心效應，海水也會隆起，同樣是高潮。',
      '與月球連線垂直的兩側海水被「借走」，水位下降，形成低潮。',
      '地球每天自轉一圈，海岸會輪流經過兩個隆起，所以一天大約有兩次漲潮與兩次退潮。',
    ],
    diagramTitle: '從上往下看（俯視圖）',
    diagramCaption: '紅點是海邊的觀測點。地球自轉時，它會輪流經過「高潮」與「低潮」。',
    tideHigh: '高潮',
    tideLow: '低潮',
    moonPull: '月球引力',
    observerLabel: '觀測點',
    earthLabel: '地球',
    moonLabel: '月球',
    eclipseDetailButton: '進一步認識：月蝕 ▸',
    eclipseType: '日—地—月系統',
    eclipseTitle: '月蝕是怎麼發生的？',
    eclipseScene: '日地月立體模型',
    eclipseIntro: '滿月時，如果太陽、地球、月球排成一直線，月球走進地球的影子裡，就發生月蝕。',
    eclipsePoints: [
      '太陽照向地球，會在地球背後拉出一條長長的影子。',
      '月球繞到地球背後、走進這條影子時，照不到陽光，看起來就變暗變紅。',
      '月蝕只發生在滿月，因為這時月球才在地球背對太陽的那一側。',
    ],
    eclipseDiagramTitle: '從側面看（示意圖）',
    eclipseDiagramCaption: '地球擋住太陽光，在背後拉出影子；月球走進影子裡，就是月蝕。',
    sunLabel: '太陽',
    shadowLabel: '地影',
  },
  en: {
    languageLabel: 'Language switcher',
    languageButton: 'Chinese',
    title: 'Solar System Exploration Classroom',
    controls: 'Animation controls',
    pause: 'Pause',
    play: 'Play',
    speed: 'Orbital speed',
    stage: 'Clickable solar system model',
    scene: '3D solar system model',
    scaleNote:
      'Drag to rotate the view and scroll to zoom. The scale is adjusted to make the planets and orbits easier to observe.',
    facts: {
      order: 'Position',
      distance: 'Distance',
      diameter: 'Size',
      mass: 'Mass',
      composition: 'Composition',
      rotation: 'Rotation',
      revolution: 'Orbit',
      temperature: 'Temperature',
      moons: 'Moons',
    },
    sourceNote:
      'Data references NASA Planetary Fact Sheet and NASA Solar System. Values are simplified for learning.',
    speedOptions: [
      { label: 'Slow', value: 0.2 },
      { label: 'Normal', value: 0.35 },
      { label: 'Fast', value: 1 },
    ],
    detailButton: 'Learn more: the Moon and tides ▸',
    backButton: '◂ Back to the solar system',
    earthSpinOn: 'Earth spin: On',
    earthSpinOff: 'Earth spin: Off',
    earthMoonScene: '3D model of the Earth and the Moon',
    tideType: 'Earth–Moon system',
    tideTitle: 'Earth and the Moon',
    tideIntro: "The Moon's gravity pulls on Earth's oceans, creating tides.",
    tidePoints: [
      "On the side facing the Moon, gravity pulls the water up into a bulge — high tide.",
      'On the far side, inertia (the centrifugal effect) makes the water bulge out too — also high tide.',
      'The water perpendicular to the Earth–Moon line is drawn away, so its level drops — low tide.',
      'Earth spins once a day, so a coast passes through both bulges, giving roughly two high tides and two low tides each day.',
    ],
    diagramTitle: 'Seen from above (top view)',
    diagramCaption: 'The red dot is a spot by the sea. As Earth spins, it passes through high tide and low tide in turn.',
    tideHigh: 'High tide',
    tideLow: 'Low tide',
    moonPull: "Moon's pull",
    observerLabel: 'Marked spot',
    earthLabel: 'Earth',
    moonLabel: 'Moon',
    eclipseDetailButton: 'Learn more: lunar eclipses ▸',
    eclipseType: 'Sun–Earth–Moon system',
    eclipseTitle: 'What causes a lunar eclipse?',
    eclipseScene: '3D model of the Sun, Earth, and Moon',
    eclipseIntro:
      "At full moon, if the Sun, Earth, and Moon line up, the Moon moves into Earth's shadow — that's a lunar eclipse.",
    eclipsePoints: [
      'Sunlight hits the Earth and casts a long shadow behind it.',
      "When the Moon travels into that shadow, sunlight can't reach it, so it turns dark and reddish.",
      'A lunar eclipse only happens at full moon, when the Moon is on the side of Earth facing away from the Sun.',
    ],
    eclipseDiagramTitle: 'Seen from the side',
    eclipseDiagramCaption: "Earth blocks the sunlight and casts a shadow; when the Moon enters it, an eclipse happens.",
    sunLabel: 'Sun',
    shadowLabel: "Earth's shadow",
  },
}

function localizeBody(body, language) {
  return {
    ...body,
    ...(language === 'en' ? body.en : {}),
    secondaryName: language === 'zh' ? body.englishName : '',
  }
}

function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Top-down schematic of the Earth–Moon tides, complementing the 3D scene.
function TideDiagram({ text }) {
  const cx = 150
  const cy = 110
  const earthR = 34
  const observerAngle = -35 * (Math.PI / 180)
  const observerX = cx + Math.cos(observerAngle) * earthR
  const observerY = cy + Math.sin(observerAngle) * earthR
  return (
    <figure className="tide-diagram">
      <svg viewBox="0 0 340 220" role="img" aria-label={text.diagramTitle}>
        {/* egg-shaped ocean stretched toward the Moon (to the right) */}
        <ellipse cx={cx} cy={cy} rx={earthR * 1.75} ry={earthR * 1.12} fill="#4fc3f7" opacity="0.32" />
        {/* Earth */}
        <circle cx={cx} cy={cy} r={earthR} fill="#2f80ed" />
        <line x1={cx - earthR} y1={cy} x2={cx + earthR} y2={cy} stroke="#fbbf24" strokeWidth="1.5" opacity="0.85" />
        <text x={cx} y={cy + 4} textAnchor="middle" className="tide-diagram-body">{text.earthLabel}</text>
        {/* observer dot on the Moon-facing side, offset upward so labels do not overlap */}
        <circle cx={observerX} cy={observerY} r="5" fill="#ff5252" stroke="#fff" strokeWidth="1" />
        <text x={observerX} y={observerY - 12} textAnchor="middle" className="tide-diagram-observer">{text.observerLabel}</text>
        {/* Moon + gravity arrow */}
        <line x1={cx + earthR * 1.72} y1={cy + 22} x2={292} y2={cy + 22} stroke="#fde047" strokeWidth="2.5" markerEnd="url(#tide-arrow)" />
        <defs>
          <marker id="tide-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#fde047" />
          </marker>
        </defs>
        <circle cx={312} cy={cy} r="14" fill="#b9b6ad" />
        <text x={312} y={cy + 32} textAnchor="middle" className="tide-diagram-body">{text.moonLabel}</text>
        <text x={236} y={cy + 42} textAnchor="middle" className="tide-diagram-pull">{text.moonPull}</text>
        {/* high tide at the two bulge tips */}
        <text x={cx - earthR * 1.75 - 4} y={cy + 4} textAnchor="end" className="tide-diagram-high">{text.tideHigh}</text>
        <text x={cx + earthR * 1.75 + 4} y={cy + 4} textAnchor="start" className="tide-diagram-high">{text.tideHigh}</text>
        {/* low tide top and bottom */}
        <text x={cx} y={cy - earthR * 1.12 - 6} textAnchor="middle" className="tide-diagram-low">{text.tideLow}</text>
        <text x={cx} y={cy + earthR * 1.12 + 16} textAnchor="middle" className="tide-diagram-low">{text.tideLow}</text>
      </svg>
      <figcaption>{text.diagramCaption}</figcaption>
    </figure>
  )
}

// Side view of the Sun–Earth–Moon alignment during a lunar eclipse, complementing the 3D scene.
function EclipseDiagram({ text }) {
  const cy = 110
  const earthX = 150
  const earthR = 20
  return (
    <figure className="tide-diagram">
      <svg viewBox="0 0 340 220" role="img" aria-label={text.eclipseDiagramTitle}>
        {/* Sun on the left */}
        <circle cx={36} cy={cy} r={26} fill="#fbbf24" />
        <text x={36} y={cy + 44} textAnchor="middle" className="tide-diagram-body">{text.sunLabel}</text>
        {/* sunlight rays grazing the Earth, outlining the shadow */}
        <line x1={44} y1={cy - 25} x2={earthX} y2={cy - earthR} stroke="#fde047" strokeWidth="1.5" opacity="0.8" />
        <line x1={44} y1={cy + 25} x2={earthX} y2={cy + earthR} stroke="#fde047" strokeWidth="1.5" opacity="0.8" />
        {/* Earth's shadow: a dark cone tapering away from the Sun */}
        <polygon
          points={`${earthX},${cy - earthR} 326,${cy - 9} 326,${cy + 9} ${earthX},${cy + earthR}`}
          fill="#0f172a"
          opacity="0.78"
        />
        <text x={238} y={cy - 22} textAnchor="middle" className="tide-diagram-low">{text.shadowLabel}</text>
        {/* Earth */}
        <circle cx={earthX} cy={cy} r={earthR} fill="#2f80ed" />
        <text x={earthX} y={cy + 40} textAnchor="middle" className="tide-diagram-body">{text.earthLabel}</text>
        {/* eclipsed Moon inside the shadow */}
        <circle cx={278} cy={cy} r={9} fill="#9a3412" stroke="#f8fafc" strokeWidth="0.8" opacity="0.95" />
        <text x={278} y={cy + 30} textAnchor="middle" className="tide-diagram-body">{text.moonLabel}</text>
      </svg>
      <figcaption>{text.eclipseDiagramCaption}</figcaption>
    </figure>
  )
}

function App() {
  const [selectedId, setSelectedId] = useState('earth')
  const [view, setView] = useState('system')
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(0.35)
  const [earthSpin, setEarthSpin] = useState(false)
  const [language, setLanguage] = useState('en')
  const handleSelectBody = useCallback((bodyId) => setSelectedId(bodyId), [])
  const text = copy[language]
  const isEarthDetail = view === 'earthDetail'
  const isLunarEclipse = view === 'lunarEclipse'

  const selectedBody = useMemo(() => {
    const body =
      selectedId === 'sun'
        ? sunInfo
        : solarBodies.find((item) => item.id === selectedId) ?? solarBodies[2]

    return localizeBody(body, language)
  }, [language, selectedId])

  const factRows = [
    ['order', selectedBody.order],
    ['distance', selectedBody.distance],
    ['diameter', selectedBody.diameter],
    ['mass', selectedBody.mass],
    ['composition', selectedBody.composition],
    ['rotation', selectedBody.rotation],
    ['revolution', selectedBody.revolution],
    ['temperature', selectedBody.temperature],
    ['moons', selectedBody.moons],
  ]

  return (
    <main className="app-shell" lang={language === 'zh' ? 'zh-Hant' : 'en'}>
      <header className="app-header">
        <div>
          <h1>{text.title}</h1>
        </div>

        <div className="controls" aria-label={text.controls}>
          <button
            className="language-button"
            type="button"
            aria-label={text.languageLabel}
            onClick={() => setLanguage((current) => (current === 'zh' ? 'en' : 'zh'))}
          >
            {text.languageButton}
          </button>

          <button
            className="control-button"
            type="button"
            onClick={() => setIsPlaying((current) => !current)}
          >
            {isPlaying ? text.pause : text.play}
          </button>

          <div className="speed-group" role="group" aria-label={text.speed}>
            {text.speedOptions.map((option) => (
              <button
                className={`speed-button ${speed === option.value ? 'active' : ''}`}
                type="button"
                key={option.value}
                onClick={() => setSpeed(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {isEarthDetail && (
            <button
              className={`control-button ${earthSpin ? 'active' : ''}`}
              type="button"
              aria-pressed={earthSpin}
              onClick={() => setEarthSpin((current) => !current)}
            >
              {earthSpin ? text.earthSpinOn : text.earthSpinOff}
            </button>
          )}
        </div>
      </header>

      <section className="learning-layout">
        <section className="space-stage" aria-label={text.stage}>
          {view === 'system' && <div className="scale-note">{text.scaleNote}</div>}

          {isEarthDetail ? (
            <EarthMoonScene
              isPlaying={isPlaying}
              speed={speed}
              earthSpin={earthSpin}
              language={language}
              ariaLabel={text.earthMoonScene}
            />
          ) : isLunarEclipse ? (
            <LunarEclipseScene
              isPlaying={isPlaying}
              speed={speed}
              language={language}
              ariaLabel={text.eclipseScene}
            />
          ) : (
            <SolarSystemScene
              selectedId={selectedId}
              onSelectBody={handleSelectBody}
              isPlaying={isPlaying}
              speed={speed}
              language={language}
              ariaLabel={text.scene}
            />
          )}
        </section>

        <aside className="info-panel" aria-live="polite">
          {isEarthDetail ? (
            <>
              <p className="body-type">{text.tideType}</p>
              <h2>{text.tideTitle}</h2>

              <p className="kid-fact">{text.tideIntro}</p>

              <p className="tide-diagram-title">{text.diagramTitle}</p>
              <TideDiagram text={text} />

              <ul className="tide-explainer">
                {text.tidePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <button
                className="back-button"
                type="button"
                onClick={() => {
                  setView('system')
                  scrollToPageTop()
                }}
              >
                {text.backButton}
              </button>
            </>
          ) : isLunarEclipse ? (
            <>
              <p className="body-type">{text.eclipseType}</p>
              <h2>{text.eclipseTitle}</h2>

              <p className="kid-fact">{text.eclipseIntro}</p>

              <p className="tide-diagram-title">{text.eclipseDiagramTitle}</p>
              <EclipseDiagram text={text} />

              <ul className="tide-explainer">
                {text.eclipsePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <button
                className="back-button"
                type="button"
                onClick={() => {
                  setView('system')
                  scrollToPageTop()
                }}
              >
                {text.backButton}
              </button>
            </>
          ) : (
            <>
              <p className="body-type">{selectedBody.type}</p>
              <h2>
                {selectedBody.name}
                {selectedBody.secondaryName && <span>{selectedBody.secondaryName}</span>}
              </h2>

              <figure className="body-image-card">
                <img src={selectedBody.imageUrl} alt={selectedBody.imageAlt} />
                <figcaption>{selectedBody.imageCredit}</figcaption>
              </figure>

              <p className="kid-fact">{selectedBody.kidFact}</p>

              <dl className="facts-grid">
                {factRows.map(([key, value]) => (
                  <div key={key}>
                    <dt>{text.facts[key]}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              {selectedId === 'earth' && (
                <>
                  <button
                    className="detail-button"
                    type="button"
                    onClick={() => {
                      setView('earthDetail')
                      scrollToPageTop()
                    }}
                  >
                    {text.detailButton}
                  </button>
                  <button
                    className="detail-button"
                    type="button"
                    onClick={() => {
                      setView('lunarEclipse')
                      scrollToPageTop()
                    }}
                  >
                    {text.eclipseDetailButton}
                  </button>
                </>
              )}

              <div className="source-note">{text.sourceNote}</div>
            </>
          )}
        </aside>
      </section>
    </main>
  )
}

export default App
