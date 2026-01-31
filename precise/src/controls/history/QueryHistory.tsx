import React, { useEffect, useState } from 'react'
import {
    Box,
    Typography,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Tooltip,
    CircularProgress,
} from '@mui/material'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'

interface HistoryItem {
    query_execution_id: string
    sql_text: string
    status: string
    submitted_at: string
    completed_at: string | null
    error_message: string | null
    catalog: string | null
    database_name: string | null
    stats?: {
        queueTimeSeconds: number | null
        executionTimeSeconds: number | null
        scannedGB: number | null
        estimatedCost: { amount: number; currency: string } | null
    }
}

interface QueryHistoryProps {
    onSelectQuery: (sql: string, catalog?: string | null, database?: string | null) => void
}

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    SUCCEEDED: 'success',
    FAILED: 'error',
    CANCELLED: 'warning',
    TIMEOUT: 'error',
    RUNNING: 'info',
    QUEUED: 'default',
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ onSelectQuery }) => {
    const [items, setItems] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/history?limit=30')
            if (!response.ok) {
                throw new Error(await response.text())
            }
            const data = await response.json()
            setItems(data.items ?? [])
        } catch (err) {
            console.error('Failed to load history', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    return (
        <Box sx={{ px: 1, pt: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2">Query History</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {loading && <CircularProgress size={14} />}
                    <Tooltip title="Refresh">
                        <IconButton size="small" onClick={load}>
                            <RefreshOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <List dense sx={{ flex: 1, minHeight: 240, overflowY: 'auto' }}>
                {items.map((item) => (
                    <ListItem
                        key={item.query_execution_id}
                        onClick={() => onSelectQuery(item.sql_text, item.catalog, item.database_name)}
                        sx={{ cursor: 'pointer', py: 0.5 }}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={item.status}
                                        color={statusColor[item.status] || 'default'}
                                    />
                                    <Tooltip title={<Typography variant="caption">{item.sql_text}</Typography>} placement="right">
                                        <Typography variant="caption" noWrap sx={{ maxWidth: 180 }}>
                                            {item.sql_text}
                                        </Typography>
                                    </Tooltip>
                                </Box>
                            }
                            secondary={
                                <Typography variant="caption" color="text.secondary">
                                    {item.database_name || '-'} • {item.stats?.executionTimeSeconds ?? '-'}s •{' '}
                                    {item.stats?.scannedGB ?? '-'} GB
                                </Typography>
                            }
                        />
                    </ListItem>
                ))}
            </List>
            <Divider />
        </Box>
    )
}

export default QueryHistory
