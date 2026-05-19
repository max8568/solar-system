import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { SolarSystemScene } from './SolarSystemScene'
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
  },
}

function localizeBody(body, language) {
  return {
    ...body,
    ...(language === 'en' ? body.en : {}),
    secondaryName: language === 'zh' ? body.englishName : '',
  }
}

function App() {
  const [selectedId, setSelectedId] = useState('earth')
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(0.35)
  const [language, setLanguage] = useState('en')
  const handleSelectBody = useCallback((bodyId) => setSelectedId(bodyId), [])
  const text = copy[language]

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
        </div>
      </header>

      <section className="learning-layout">
        <section className="space-stage" aria-label={text.stage}>
          <div className="scale-note">{text.scaleNote}</div>

          <SolarSystemScene
            selectedId={selectedId}
            onSelectBody={handleSelectBody}
            isPlaying={isPlaying}
            speed={speed}
            language={language}
            ariaLabel={text.scene}
          />
        </section>

        <aside className="info-panel" aria-live="polite">
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

          <div className="source-note">{text.sourceNote}</div>
        </aside>
      </section>
    </main>
  )
}

export default App
