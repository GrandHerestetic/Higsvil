import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '../../components/button'

function Home() {
  const [displayedText, setDisplayedText] = useState('')
  const fullText = 'Professional tool for video '
  const highlightWord = 'editing'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [highlightedText, setHighlightedText] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 50)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, fullText])

  const [showHighlight, setShowHighlight] = useState(false)

  useEffect(() => {
    if (currentIndex >= fullText.length) {
      setShowHighlight(true)
    }
  }, [currentIndex, fullText.length])

  // Анимация печати для слова "editing"
  useEffect(() => {
    if (showHighlight && highlightIndex < highlightWord.length) {
      const timeout = setTimeout(() => {
        setHighlightedText(prev => prev + highlightWord[highlightIndex])
        setHighlightIndex(prev => prev + 1)
      }, 50)

      return () => clearTimeout(timeout)
    }
  }, [showHighlight, highlightIndex, highlightWord])

  return (
    <div className='min-h-screen bg-custom-black flex flex-col items-center justify-center p-4 gap-4'>
      <div>
        <div className='flex flex-col gap-6'>
          <h1 className='text-8xl font-bold'>Higgsfield</h1>
          <h2 className='text-4xl font-bold'>
            {displayedText}
            {showHighlight && (
              <span>
                {highlightedText}
                {(highlightIndex < highlightWord.length || showHighlight) && (
                  <span className='animate-pulse'>|</span>
                )}
              </span>
            )}
            {!showHighlight && <span className='animate-pulse'>|</span>}
          </h2>
        </div>
        <div className='flex flex-wrap gap-4 py-10 justify-left'>
          <Link to="/editor">
            <Button onClick={() => {}}>Get Started</Button>
          </Link>
          <Link to="/projects">
            <Button onClick={() => {}}>Projects</Button>  
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home

