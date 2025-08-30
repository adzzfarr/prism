import './App.css'
import Home from './pages/Home.js'

export function App(props: {
  onRender?: () => void
}) {
  return (
    <Home />
  )
}
