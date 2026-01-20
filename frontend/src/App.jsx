import { useState, useCallback, useEffect } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const handleFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }, [])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const analyzeImage = async () => {
    if (!selectedFile) return

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className={`app ${isDark ? 'dark' : 'light'}`}>
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">🤖</span>
          <span className="logo-text">IsitAI</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          <div className="toggle-track">
            <span className="toggle-icon sun">☀️</span>
            <span className="toggle-icon moon">🌙</span>
            <div className="toggle-thumb"></div>
          </div>
        </button>
      </nav>

      <div className="container">

        <main className="main">
          {!preview ? (
            <div
              className={`upload-zone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleChange}
                hidden
              />
              <label htmlFor="file-input" className="upload-label">
                <div className="upload-icon">☁️</div>
                <p className="upload-text">Drop image here</p>
                <span className="upload-formats">JPG, PNG, WebP</span>
              </label>
            </div>
          ) : (
            <div className="preview-section">
              <div className="image-container">
                <img src={preview} alt="Preview" className="preview-image" />
                {result && !result.error && (
                  <div className={`result-badge ${result.is_fake ? 'fake' : 'real'}`}>
                    {result.label}
                  </div>
                )}
              </div>

              {result && !result.error && (
                <div className="result-details">
                  <div className={`result-card ${result.is_fake ? 'fake' : 'real'}`}>
                    <div className="result-header">
                      <span className="result-icon">{result.is_fake ? '⚠️' : '✅'}</span>
                      <span className="result-label">{result.label}</span>
                    </div>
                    <div className="confidence-section">
                      <span className="confidence-label">Confidence</span>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="confidence-value">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="probabilities">
                      <div className="prob-item">
                        <span>Real</span>
                        <span>{(result.probabilities.real * 100).toFixed(1)}%</span>
                      </div>
                      <div className="prob-item">
                        <span>Fake</span>
                        <span>{(result.probabilities.fake * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result?.error && (
                <div className="error-message">
                  <span>❌</span> {result.error}
                </div>
              )}

              <div className="action-buttons">
                {!result && (
                  <button
                    className="btn btn-primary"
                    onClick={analyzeImage}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Analyzing...
                      </>
                    ) : (
                      '🔍 Analyze Image'
                    )}
                  </button>
                )}
                <button className="btn btn-secondary" onClick={resetAll}>
                  {result ? '📤 Upload New Image' : '✕ Cancel'}
                </button>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  )
}

export default App
