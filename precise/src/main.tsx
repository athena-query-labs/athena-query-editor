import React, { useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Stack, Switch, Tooltip } from '@mui/material'
import Brightness4OutlinedIcon from '@mui/icons-material/Brightness4Outlined'
import Brightness7OutlinedIcon from '@mui/icons-material/Brightness7Outlined'
import QueryEditor from './QueryEditor'

function useObservedHeight<T extends HTMLElement>(ref: React.RefObject<T> | React.RefObject<T | null>) {
    const [height, setHeight] = useState(0)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        // Initial measure
        setHeight(el.getBoundingClientRect().height)

        const ro = new ResizeObserver(([entry]) => {
            setHeight(entry.contentRect.height)
        })
        ro.observe(el)

        return () => ro.disconnect()
    }, [ref])

    return height
}

export default function App() {
    const slotRef = useRef<HTMLDivElement>(null)
    const slotHeight = useObservedHeight(slotRef)
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
        try {
            const saved = localStorage.getItem('athenaTheme')
            if (saved === 'dark' || saved === 'light') {
                return saved
            }
        } catch {
            // ignore storage access errors
        }
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })

    const toggleTheme = () => {
        const next = themeMode === 'dark' ? 'light' : 'dark'
        setThemeMode(next)
        try {
            localStorage.setItem('athenaTheme', next)
        } catch {
            // ignore storage access errors
        }
    }

    return (
        <div
            style={{
                height: '100vh',
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                }}
            >
                <h1 style={{ margin: 0 }}>Athena query editor - Example app</h1>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {themeMode === 'dark' ? (
                        <Brightness4OutlinedIcon fontSize="small" />
                    ) : (
                        <Brightness7OutlinedIcon fontSize="small" />
                    )}
                    <Tooltip title={themeMode === 'dark' ? 'Dark mode' : 'Light mode'}>
                        <Switch
                            size="small"
                            checked={themeMode === 'dark'}
                            onChange={toggleTheme}
                            inputProps={{ 'aria-label': 'Theme toggle' }}
                        />
                    </Tooltip>
                </Stack>
            </div>
            <div ref={slotRef} style={{ minHeight: 0 }}>
                <QueryEditor theme={themeMode} height={slotHeight} />
            </div>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
