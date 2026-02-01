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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined'

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
    onDrawerToggle?: () => void
}

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    SUCCEEDED: 'success',
    FAILED: 'error',
    CANCELLED: 'warning',
    TIMEOUT: 'error',
    RUNNING: 'info',
    QUEUED: 'default',
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ onSelectQuery, onDrawerToggle }) => {
    const [items, setItems] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/history?limit=30')
            if (!response.ok) {
                throw new Error(await response.text())
            }
            const data = await response.json()
            const sortedItems = [...(data.items ?? [])].sort(
                (a: HistoryItem, b: HistoryItem) =>
                    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            )
            setItems(sortedItems)
        } catch (err) {
            console.error('Failed to load history', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyId = (event: React.MouseEvent, id: string) => {
        event.stopPropagation()
        void navigator.clipboard.writeText(id)
        setCopiedId(id)
        window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200)
    }

    const handleCopySql = (event: React.MouseEvent, id: string, sql: string) => {
        event.stopPropagation()
        void navigator.clipboard.writeText(sql)
        setCopiedSqlId(id)
        window.setTimeout(() => setCopiedSqlId((current) => (current === id ? null : current)), 1200)
    }

    useEffect(() => {
        load()
    }, [])

    const formatSubmittedAt = (value: string) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return value
        return date.toLocaleString(undefined, {
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    const formatSeconds = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '-'
        return `${value.toFixed(2)}s`
    }

    const formatGB = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '-'
        return `${value.toFixed(2)} GB`
    }

    const formatCost = (value: { amount: number; currency: string } | null | undefined) => {
        if (!value) return '-'
        return `${value.amount.toFixed(2)} ${value.currency}`
    }

    return (
        <Box
            sx={{
                px: 0,
                pt: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minWidth: 0,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.25, pt: 0 }}>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {loading && <CircularProgress size={14} />}
                    <Tooltip title="Refresh">
                        <IconButton size="small" onClick={load}>
                            <RefreshOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {onDrawerToggle && (
                        <Tooltip title="Close drawer">
                            <IconButton size="small" onClick={onDrawerToggle}>
                                <ChevronLeftIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
            <List dense sx={{ flex: 1, minHeight: 240, overflowY: 'auto', minWidth: 0, py: 0 }}>
                {items.map((item) => (
                    <ListItem
                        key={item.query_execution_id}
                        onClick={() => onSelectQuery(item.sql_text, item.catalog, item.database_name)}
                        sx={{ cursor: 'pointer', py: 0.05, alignItems: 'flex-start' }}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={item.status}
                                        color={statusColor[item.status] || 'default'}
                                        sx={{
                                            height: 18,
                                            minWidth: 70,
                                            fontSize: '0.36rem',
                                            fontFamily: 'monospace',
                                            '& .MuiChip-label': {
                                                px: 0.7,
                                                lineHeight: 1.3,
                                                width: '100%',
                                                textAlign: 'center',
                                            },
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                        {formatSubmittedAt(item.submitted_at)}
                                    </Typography>
                                </Box>
                            }
                            secondary={
                                <Box sx={{ mt: 0.05, display: 'flex', flexDirection: 'column', gap: 0.1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, minWidth: 0 }}>
                                        <NumbersOutlinedIcon
                                            sx={{
                                                fontSize: 12,
                                                color: 'text.disabled',
                                                transform: 'rotate(-18deg)',
                                            }}
                                        />
                                        <Tooltip title={item.query_execution_id} placement="right">
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                noWrap
                                                onClick={(event) => handleCopyId(event, item.query_execution_id)}
                                                sx={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    fontSize: '0.2rem',
                                                    fontFamily: 'monospace',
                                                    cursor: 'pointer',
                                                    transition: 'color 120ms ease',
                                                    color:
                                                        copiedId === item.query_execution_id
                                                            ? 'success.main'
                                                            : 'text.secondary',
                                                }}
                                            >
                                                {item.query_execution_id}
                                            </Typography>
                                        </Tooltip>
                                    </Box>
                                    <Tooltip
                                        title={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                                <Typography variant="caption">
                                                    {`Status: ${item.status}`}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {`Start: ${formatSubmittedAt(item.submitted_at)}`}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {`Queue Time: ${formatSeconds(item.stats?.queueTimeSeconds)}`}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {`Execution Time: ${formatSeconds(item.stats?.executionTimeSeconds)}`}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {`Scanned: ${formatGB(item.stats?.scannedGB)}`}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {`Cost: ${formatCost(item.stats?.estimatedCost)}`}
                                                </Typography>
                                            </Box>
                                        }
                                        placement="right"
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                Q {formatSeconds(item.stats?.queueTimeSeconds)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                E {formatSeconds(item.stats?.executionTimeSeconds)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                S {formatGB(item.stats?.scannedGB)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                C {formatCost(item.stats?.estimatedCost)}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35, minWidth: 0 }}>
                                        {expandedId !== item.query_execution_id ? (
                                            <Tooltip
                                                title={<Typography variant="caption">{item.sql_text}</Typography>}
                                                placement="right"
                                            >
                                                <Typography variant="caption" noWrap sx={{ maxWidth: 420, minWidth: 0 }}>
                                                    {item.sql_text}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {item.sql_text}
                                            </Typography>
                                        )}
                                        <Box
                                            sx={{
                                                ml: 'auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Tooltip title={copiedSqlId === item.query_execution_id ? 'Copied' : 'Copy SQL'}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) =>
                                                        handleCopySql(event, item.query_execution_id, item.sql_text)
                                                    }
                                                    sx={{ p: 0.25 }}
                                                >
                                                    <ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip
                                                title={expandedId === item.query_execution_id ? 'Collapse' : 'Expand'}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        setExpandedId((current) =>
                                                            current === item.query_execution_id ? null : item.query_execution_id
                                                        )
                                                    }}
                                                    sx={{ p: 0.25 }}
                                                >
                                                    {expandedId === item.query_execution_id ? (
                                                        <ExpandLessOutlinedIcon sx={{ fontSize: 16 }} />
                                                    ) : (
                                                        <ExpandMoreOutlinedIcon sx={{ fontSize: 16 }} />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Box>
                            }
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                        />
                    </ListItem>
                ))}
            </List>
            <Divider />
        </Box>
    )
}

export default QueryHistory
