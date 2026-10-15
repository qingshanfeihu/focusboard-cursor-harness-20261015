import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { TaskProvider } from './store'
import './index.css'
import './App.css'

const root = document.getElementById('root')
if (!root) throw new Error('找不到根节点')

createRoot(root).render(
  <StrictMode>
    <TaskProvider>
      <App />
    </TaskProvider>
  </StrictMode>,
)
