import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { SolarSystemScene } from './SolarSystemScene'
import { solarBodies, sunInfo } from './solarSystemData'

const speedOptions = [
  { label: '慢', value: 0.35 },
  { label: '標準', value: 0.65 },
  { label: '快', value: 1 },
]

function App() {
  const [selectedId, setSelectedId] = useState('earth')
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(0.65)
  const handleSelectBody = useCallback((bodyId) => setSelectedId(bodyId), [])

  const selectedBody = useMemo(() => {
    if (selectedId === 'sun') {
      return sunInfo
    }

    return solarBodies.find((body) => body.id === selectedId) ?? solarBodies[2]
  }, [selectedId])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>太陽系探索教室</h1>
        </div>

        <div className="controls" aria-label="動畫控制">
          <button
            className="control-button"
            type="button"
            onClick={() => setIsPlaying((current) => !current)}
          >
            {isPlaying ? '暫停' : '播放'}
          </button>

          <div className="speed-group" role="group" aria-label="公轉速度">
            {speedOptions.map((option) => (
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

          <button className="control-button" type="button" onClick={() => setSelectedId('earth')}>
            回到地球
          </button>
        </div>
      </header>

      <section className="learning-layout">
        <section className="space-stage" aria-label="可點選的太陽系模型">
          <div className="scale-note">拖曳可旋轉視角，滾輪可縮放。示意比例經過調整，方便觀察行星與軌道。</div>

          <SolarSystemScene
            selectedId={selectedId}
            onSelectBody={handleSelectBody}
            isPlaying={isPlaying}
            speed={speed}
          />
        </section>

        <aside className="info-panel" aria-live="polite">
          <p className="body-type">{selectedBody.type}</p>
          <h2>
            {selectedBody.name}
            <span>{selectedBody.englishName}</span>
          </h2>

          <figure className="body-image-card">
            <img src={selectedBody.imageUrl} alt={selectedBody.imageAlt} />
            <figcaption>{selectedBody.imageCredit}</figcaption>
          </figure>

          <p className="kid-fact">{selectedBody.kidFact}</p>

          <dl className="facts-grid">
            <div>
              <dt>位置</dt>
              <dd>{selectedBody.order}</dd>
            </div>
            <div>
              <dt>距離</dt>
              <dd>{selectedBody.distance}</dd>
            </div>
            <div>
              <dt>大小</dt>
              <dd>{selectedBody.diameter}</dd>
            </div>
            <div>
              <dt>質量</dt>
              <dd>{selectedBody.mass}</dd>
            </div>
            <div>
              <dt>組成</dt>
              <dd>{selectedBody.composition}</dd>
            </div>
            <div>
              <dt>自轉</dt>
              <dd>{selectedBody.rotation}</dd>
            </div>
            <div>
              <dt>公轉</dt>
              <dd>{selectedBody.revolution}</dd>
            </div>
            <div>
              <dt>溫度</dt>
              <dd>{selectedBody.temperature}</dd>
            </div>
            <div>
              <dt>衛星</dt>
              <dd>{selectedBody.moons}</dd>
            </div>
          </dl>

          <div className="source-note">
            資料參考 NASA Planetary Fact Sheet 與 NASA Solar System。數值以學習用途做簡化。
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
