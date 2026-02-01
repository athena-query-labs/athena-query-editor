import React from 'react'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Link,
    Tooltip,
    Typography,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Chip, { ChipProps } from '@mui/material/Chip'
import ReactDOMServer from 'react-dom/server'
import CopyLink from './utils/CopyLink'
import ClearButton from './utils/ClearButton'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'

interface ResultSetProps {
    queryId: string | undefined
    results: any[]
    columns: any[]
    response: any
    height: number
    errorMessage: string
    onClearResults: (queryId: string | undefined) => void
}

interface ResultSetState {
    downloadUrl: string | null
    downloadFilename: string | null
    downloadPartial: boolean
    downloadUnavailable: boolean
    downloading: boolean
}

class ResultSet extends React.Component<ResultSetProps, ResultSetState> {
    previousRunningPercentage: number = 0
    statsHistory: any[] = []
    lastQueryId: string | undefined = undefined

    static readonly STATE_COLOR_MAP: Record<string, ChipProps['color']> = {
        QUEUED: 'default',
        RUNNING: 'info',
        SUCCEEDED: 'success',
        FAILED: 'error',
        CANCELLED: 'warning',
        TIMEOUT: 'error',
    }

    state: ResultSetState = {
        downloadUrl: null,
        downloadFilename: null,
        downloadPartial: false,
        downloadUnavailable: false,
        downloading: false,
    }

    getQueryStateColor(queryState: string): ChipProps['color'] {
        switch (queryState) {
            case 'QUEUED':
                return ResultSet.STATE_COLOR_MAP.QUEUED
            case 'RUNNING':
                return ResultSet.STATE_COLOR_MAP.RUNNING
            case 'SUCCEEDED':
                return ResultSet.STATE_COLOR_MAP.FINISHED
            case 'FAILED':
                return ResultSet.STATE_COLOR_MAP.UNKNOWN_ERROR
            case 'CANCELLED':
                return ResultSet.STATE_COLOR_MAP.CANCELED
            case 'TIMEOUT':
                return ResultSet.STATE_COLOR_MAP.UNKNOWN_ERROR
            default:
                return ResultSet.STATE_COLOR_MAP.QUEUED
        }
    }

    renderHeader(columns: any) {
        return (
            <thead>
                <tr>
                    {columns.map((column: any, index: any) => (
                        <th key={column.name + index} title={column.type}>
                            {column.name}
                        </th>
                    ))}
                </tr>
            </thead>
        )
    }

    renderCell(cellData: any, cellIndex: any) {
        return (
            <td key={cellIndex} className={cellData == null ? 'result-cell-null' : ''}>
                {cellData == null ? 'null' : cellData}
            </td>
        )
    }

    renderRow(rowData: any, rowIndex: any) {
        return (
            <tr key={rowIndex}>
                {rowData.map((cellData: any, cellIndex: any) => this.renderCell(cellData, cellIndex))}
            </tr>
        )
    }

    renderPage(pageData: any, pageIndex: any) {
        // Add the 'page' class to each table for styling
        return (
            <tbody key={pageIndex}>
                {pageData.map((rowData: any, rowIndex: any) => this.renderRow(rowData, rowIndex))}
            </tbody>
        )
    }

    renderTable = (results: any[], columns: any) => {
        const muiColumns: GridColDef[] = columns.map((column: any) => ({ field: column.name, minWidth: 150 }))
        const muiRows = results
            .flat()
            .map((row: any[], i: number) =>
                Object.fromEntries([
                    ['mui-row-id', `row-${i + 1}`],
                    ...columns.map((c: any, j: number) => [c.name, row[j]]),
                ])
            )

        return (
            <DataGrid
                rows={muiRows}
                columns={muiColumns}
                sx={{
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
                }}
                getRowId={(row) => String(row['mui-row-id'])}
                density="compact"
            />
        )
    }

    renderInnerTable = (results: any[], response: any, columns: any) => {
        return (
            <table className="page result-table" key={response.id}>
                {columns ? this.renderHeader(columns) : null}
                {results && results.length
                    ? results.map((pageData, pageIndex) => this.renderPage(pageData, pageIndex))
                    : null}
            </table>
        )
    }

    isFinishedFailedOrCancelled(state: string) {
        return state === 'SUCCEEDED' || state === 'FAILED' || state === 'CANCELLED' || state === 'TIMEOUT'
    }

    getRowCount() {
        const { results } = this.props
        if (!results) {
            return 0
        }
        return results.reduce((sum, page) => sum + page.length, 0)
    }

    formatMillisAsHHMMSS(millis: number) {
        const seconds = Math.floor(millis / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    }

    bytesToCorrectScale(bytes: number) {
        if (isNaN(bytes)) {
            return ``
        }

        if (bytes < 128) {
            return `${bytes.toFixed(0)} B`
        }
        const kb = bytes / 1024
        if (kb < 128) {
            return `${kb.toFixed(2)} KB`
        }
        const mb = kb / 1024
        if (mb < 128) {
            return `${mb.toFixed(2)} MB`
        }
        const gb = mb / 1024
        return `${gb.toFixed(2)} GB`
    }

    unpackSubstages(subStages: any, stages: any[], depth: number): any[] {
        if (subStages) {
            for (let i = 0; i < subStages.length; i++) {
                const subStage = subStages[i]
                stages.push({ stage: subStage, depth: depth })
                if (subStage.subStages) {
                    this.unpackSubstages(subStage.subStages, stages, depth + 1)
                }
            }
        }
        return stages
    }

    rowCountToCorrectScale(rowCount: number) {
        // if not a number return 0
        if (isNaN(rowCount)) {
            return 0
        }

        if (rowCount < 1000) {
            return rowCount.toFixed(0)
        }
        const k = rowCount / 1000
        if (k < 1000) {
            return `${k.toFixed(1)}K`
        }
        const m = k / 1000
        if (m < 1000) {
            return `${m.toFixed(1)}M`
        }
        const b = m / 1000
        return `${b.toFixed(1)}B`
    }

    // reset function
    reset() {
        this.statsHistory = []
    }

    componentDidUpdate(prevProps: ResultSetProps) {
        if (prevProps.queryId !== this.props.queryId) {
            this.reset()
            this.setState({
                downloadUrl: null,
                downloadFilename: null,
                downloadPartial: false,
                downloadUnavailable: false,
                downloading: false,
            })
        }
    }

    formatTableAsPlainText(results: any[], columns: any[]): string {
        if (!columns || columns.length === 0) {
            return ''
        }

        // Calculate the maximum width for each column
        const columnWidths = columns.map((column: any) =>
            Math.max(
                column.name.length,
                ...results.flat().map((row: any[]) => row[columns.indexOf(column)]?.toString().length || 0)
            )
        )

        // Create the header
        let tableText =
            columns.map((column: any, index: number) => column.name.padEnd(columnWidths[index])).join(' | ') + '\n'

        // Add a separator line
        tableText += columnWidths.map((width) => '-'.repeat(width)).join('-+-') + '\n'

        // Add the data rows
        results.forEach((page: any[]) => {
            page.forEach((row: any[]) => {
                tableText +=
                    row
                        .map((cell: any, index: number) => (cell?.toString() || '').padEnd(columnWidths[index]))
                        .join(' | ') + '\n'
            })
        })

        return tableText
    }

    copy() {
        const { results, columns } = this.props
        const htmlContent = ReactDOMServer.renderToString(this.renderInnerTable(results, this.props.response, columns))
        const plainTextContent = this.formatTableAsPlainText(results, columns)

        const blobHtml = new Blob([htmlContent], { type: 'text/html' })
        const blobText = new Blob([plainTextContent], { type: 'text/plain' })

        navigator.clipboard
            .write([
                new ClipboardItem({
                    'text/html': blobHtml,
                    'text/plain': blobText,
                }),
            ])
            .then(() => {
                console.log('Table copied successfully')
            })
            .catch((err) => {
                console.error('Failed to copy table:', err)
            })
    }

    async fetchDownloadLink() {
        const { queryId } = this.props
        if (!queryId) return
        this.setState({ downloading: true, downloadUnavailable: false })
        try {
            const response = await fetch(`/api/query/${queryId}/download`)
            if (!response.ok) {
                throw new Error(await response.text())
            }
            const data = await response.json()
            if (!data.available) {
                this.setState({
                    downloadUnavailable: true,
                    downloadUrl: null,
                    downloadFilename: null,
                    downloadPartial: false,
                })
            } else {
                this.setState({
                    downloadUnavailable: false,
                    downloadUrl: data.url,
                    downloadFilename: data.filename,
                    downloadPartial: Boolean(data.partial),
                })
            }
        } catch (error) {
            console.error('Failed to get download link', error)
            this.setState({ downloadUnavailable: true })
        } finally {
            this.setState({ downloading: false })
        }
    }

    render() {
        const { queryId, results, columns, response, height, errorMessage } = this.props
        const { downloadUrl, downloadFilename, downloadPartial, downloadUnavailable, downloading } = this.state

        this.lastQueryId = queryId
        const state = response?.state ?? 'IDLE'
        const stats = response?.stats ?? {}
        const isRunning = state === 'RUNNING' || state === 'QUEUED'

        // Ensure the 'result-set' class is applied to the container
        return (
            <Box>
                <Box display="flex" alignItems="center" gap={1} fontSize="0.8rem" sx={{ p: 1 }}>
                    {errorMessage ? (
                        <Alert severity="error" sx={{ py: 0 }}>
                            {errorMessage}
                        </Alert>
                    ) : null}
                    <Chip size="small" label={state} color={this.getQueryStateColor(state)} />
                    {isRunning ? <CircularProgress size={16} /> : null}
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem' }}>
                        {queryId ? (
                            <>
                                <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                                    ID: {queryId}
                                </Typography>
                                <Tooltip title="Copy Query ID">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            void navigator.clipboard.writeText(queryId)
                                        }}
                                    >
                                        <ContentCopyOutlinedIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : null}
                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                            {this.getRowCount()} rows
                        </Typography>
                        {columns && columns.length ? (
                            this.isFinishedFailedOrCancelled(state) ? (
                                <>
                                    <ClearButton onClear={() => this.props.onClearResults(queryId)} />
                                    <CopyLink copy={() => this.copy()} />
                                </>
                            ) : null
                        ) : null}
                    </Box>
                </Box>

                <Box sx={{ px: 1, pb: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="caption">Queue: {stats.queueTimeSeconds ?? '-'}s</Typography>
                    <Typography variant="caption">Exec: {stats.executionTimeSeconds ?? '-'}s</Typography>
                    <Typography variant="caption">Scanned: {stats.scannedGB ?? '-'} GB</Typography>
                    <Typography variant="caption">
                        Cost:{' '}
                        {stats.estimatedCost
                            ? `${stats.estimatedCost.amount} ${stats.estimatedCost.currency}`
                            : '-'}
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => this.fetchDownloadLink()}
                            disabled={!queryId || downloading}
                        >
                            {downloading ? 'Preparing...' : 'Download'}
                        </Button>
                        {downloadUrl ? (
                            <Link href={downloadUrl} target="_blank" rel="noreferrer">
                                {downloadFilename ?? 'Download'}
                            </Link>
                        ) : null}
                        {downloadPartial ? (
                            <Typography variant="caption" color="warning.main">
                                Partial
                            </Typography>
                        ) : null}
                        {downloadUnavailable ? (
                            <Typography variant="caption" color="text.secondary">
                                No download available
                            </Typography>
                        ) : null}
                    </Box>
                </Box>

                {columns && columns.length ? (
                    <Box
                        sx={{
                            height: height - 84,
                            overflowY: 'auto',
                        }}
                    >
                        {this.renderTable(results, columns)}
                    </Box>
                ) : null}
            </Box>
        )
    }
}

export default ResultSet
