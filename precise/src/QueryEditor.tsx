import React, { useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import { Box, Drawer, useMediaQuery } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import QueryCell from './QueryCell'
import { darkTheme, lightTheme } from './theme'
import Queries from './schema/Queries'
import QueryInfo from './schema/QueryInfo'
import CatalogViewer from './controls/catalog_viewer/CatalogViewer'
import QueryHistory from './controls/history/QueryHistory'
import { Tabs, Tab } from '@mui/material'

interface IQueryEditor {
    height: number
    theme?: 'dark' | 'light'
    enableCatalogSearchColumns?: boolean
}

const DRAWER_WIDTH = 315

const Main = styled('main')(({ theme }) => ({
    minWidth: 0,
    padding: theme.spacing(3),
    width: '100%',
}))

export const QueryEditor = ({ height, theme, enableCatalogSearchColumns }: IQueryEditor) => {
    const [queries] = useState<Queries>(() => new Queries())
    const [drawerOpen, setDrawerOpen] = useState<boolean>(true)
    const [currentQuery, setCurrentQuery] = useState<QueryInfo>(queries.getCurrentQuery())
    const [drawerTab, setDrawerTab] = useState<'catalog' | 'history'>('catalog')
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
    const enableSearchColumns = false
    const containerRef = useRef(null)

    const muiThemeToUse = () => {
        if (theme === 'dark') {
            return darkTheme
        }
        if (theme === 'light') {
            return lightTheme
        }
        return prefersDarkMode ? darkTheme : lightTheme
    }

    const applyQueryUpdates = (updates: Partial<QueryInfo>) => {
        const activeQuery = queries.getCurrentQuery()

        if (!activeQuery) {
            return
        }

        queries.updateQuery(activeQuery.id, updates)
        setCurrentQuery((prev) => ({ ...prev, ...updates }))
    }

    const setQueryContent = (query: string, catalog?: string, schema?: string) => {
        const updates: Partial<QueryInfo> = {}

        if (query) {
            updates.query = query
        }

        if (catalog) {
            updates.catalog = catalog
        }

        if (schema) {
            updates.schema = schema
        }

        applyQueryUpdates(updates)
    }

    const appendQueryContent = (query: string, catalog?: string, schema?: string) => {
        const activeQuery = queries.getCurrentQuery()
        const updates: Partial<QueryInfo> = {}

        if (query !== undefined) {
            const existingQuery = activeQuery.query || ''
            const separator = existingQuery.trim() === '' || query.trim() === '' ? '' : '\n\n'
            updates.query = existingQuery + separator + query
        }

        if (catalog !== undefined) {
            updates.catalog = catalog
        }

        if (schema !== undefined) {
            updates.schema = schema
        }

        applyQueryUpdates(updates)
    }

    return (
        <ThemeProvider theme={muiThemeToUse()}>
            <CssBaseline />
            <Box
                ref={containerRef}
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    height: height,
                    minWidth: 0,
                    display: 'grid',
                    gridTemplateColumns: drawerOpen ? `${DRAWER_WIDTH}px 1fr` : '0px 1fr',
                }}
            >
                <Drawer
                    sx={{
                        gridColumn: 1,
                        flexShrink: 0,
                        height: '100%',
                        minHeight: 0,
                        pointerEvents: drawerOpen ? 'auto' : 'none',
                    }}
                    variant="persistent"
                    anchor="left"
                    open={drawerOpen}
                    ModalProps={{
                        container: containerRef.current,
                        disablePortal: true,
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                width: '100%',
                                boxSizing: 'border-box',
                                position: 'static',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                minHeight: 0,
                                height: '100%',
                            },
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <Tabs
                            value={drawerTab}
                            onChange={(_, value) => setDrawerTab(value)}
                            variant="fullWidth"
                            sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
                        >
                            <Tab value="catalog" label="Catalog" />
                            <Tab value="history" label="History" />
                        </Tabs>
                        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <Box
                                sx={{
                                    display: drawerTab === 'history' ? 'flex' : 'none',
                                    flex: 1,
                                    minHeight: 0,
                                    flexDirection: 'column',
                                    height: '100%',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                    <QueryHistory
                                        onSelectQuery={setQueryContent}
                                        onDrawerToggle={() => setDrawerOpen(false)}
                                    />
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    display: drawerTab === 'catalog' ? 'flex' : 'none',
                                    flex: 1,
                                    minHeight: 0,
                                    flexDirection: 'column',
                                    height: '100%',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                    <CatalogViewer
                                        onGenerateQuery={setQueryContent}
                                        onAppendQuery={appendQueryContent}
                                        onDrawerToggle={() => setDrawerOpen(false)}
                                        enableSearchColumns={enableSearchColumns}
                                        currentCatalog={currentQuery.catalog}
                                        currentSchema={currentQuery.schema}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Drawer>

                <Main sx={{ p: 0, minWidth: 0, gridColumn: 2 }}>
                    <QueryCell
                        queries={queries}
                        drawerOpen={drawerOpen}
                        height={height}
                        onDrawerToggle={() => setDrawerOpen(true)}
                        themeMode={
                            theme === 'dark' || theme === 'light'
                                ? theme
                                : prefersDarkMode
                                  ? 'dark'
                                  : 'light'
                        }
                    />
                </Main>
            </Box>
        </ThemeProvider>
    )
}

export default QueryEditor
