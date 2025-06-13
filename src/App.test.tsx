import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  test('displays the app title', () => {
    render(<App />)
    expect(screen.getByText(/workout tracker/i)).toBeInTheDocument()
  })

  test('has proper semantic structure for PWA', () => {
    // Test that the app has proper semantic structure for PWA
    render(<App />)
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    
    // Verify the structure is accessible and PWA-ready
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})