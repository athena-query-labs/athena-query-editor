class AthenaQueryRunner {
    private queryId: string | null = null
    private isRunning: boolean = false
    private cancellationRequested: boolean = false
    private pendingStart: { statement: string; catalog?: string; database?: string } | null = null
    private resultsPages: any[] = []
    private columns: any[] = []
    private rowsRead: number = 0
    private pollingTimer: number | null = null

    SetResults = (_newResults: any[]) => {}
    private setAllResults = (_allResults: any[], _error: boolean) => void {}
    SetColumns = (_newColumns: any[]) => {}
    private setStatus = (_newStatus: any) => {}
    SetScanStats = (_newScanStats: any) => {}
    private setErrorMessage = (_newErrorMessage: string) => {}
    SetCancelling = () => {}
    SetStopped = () => {}
    SetStarted = () => {}

    SetAllResultsCallback(setAllResults: (allResults: any[], error: boolean) => any): AthenaQueryRunner {
        this.setAllResults = setAllResults
        return this
    }

    SetStatusCallback(setStatus: (newStatus: any) => any): AthenaQueryRunner {
        this.setStatus = setStatus
        return this
    }

    SetErrorMessageCallback(setErrorMessage: (message: string) => any): AthenaQueryRunner {
        this.setErrorMessage = setErrorMessage
        return this
    }

    ClearState() {
        this.resultsPages = []
        this.columns = []
        this.rowsRead = 0
    }

    CancelQuery(cancellationReason: string) {
        if (this.isRunning && this.queryId) {
            this.cancellationRequested = true
            this.SetCancelling()
            fetch(`/api/query/${this.queryId}/cancel`, { method: 'POST' }).catch(() => {
                this.setErrorMessage(cancellationReason || 'Failed to cancel query')
            })
        }
    }

    async StartQuery(statement: string, catalog?: string, database?: string) {
        if (this.isRunning) {
            this.pendingStart = { statement, catalog, database }
            if (!this.cancellationRequested) {
                this.CancelQuery('')
            }
            return
        }

        this.isRunning = true
        this.cancellationRequested = false
        this.ClearState()
        this.SetStarted()

        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: statement, catalog, database }),
            })
            if (!response.ok) {
                throw new Error(await response.text())
            }
            const data = await response.json()
            this.queryId = data.queryId
            await this.pollStatus()
        } catch (error) {
            this.setErrorMessage(error instanceof Error ? error.message : 'Failed to start query')
            this.isRunning = false
            this.SetStopped()
        }
    }

    private async pollStatus() {
        if (!this.queryId) return
        try {
            const response = await fetch(`/api/query/${this.queryId}`)
            if (!response.ok) {
                throw new Error(await response.text())
            }
            const status = await response.json()
            this.setStatus(status)
            this.SetScanStats(status.stats)

            const state = status.state
            if (state === 'SUCCEEDED') {
                await this.fetchAllResults()
                this.isRunning = false
                this.cancellationRequested = false
                this.queryId = null
                this.SetStopped()
                this.startPendingIfAny()
                return
            }
            if (state === 'FAILED' || state === 'CANCELLED' || state === 'TIMEOUT') {
                this.isRunning = false
                this.cancellationRequested = false
                this.queryId = null
                this.SetStopped()
                if (status.statusReason) {
                    this.setErrorMessage(status.statusReason)
                }
                this.startPendingIfAny()
                return
            }

            this.pollingTimer = window.setTimeout(() => this.pollStatus(), 1000)
        } catch (error) {
            this.setErrorMessage(error instanceof Error ? error.message : 'Failed to poll status')
            this.isRunning = false
            this.cancellationRequested = false
            this.queryId = null
            this.SetStopped()
            this.startPendingIfAny()
        }
    }

    private startPendingIfAny() {
        if (!this.pendingStart) return
        const pending = this.pendingStart
        this.pendingStart = null
        void this.StartQuery(pending.statement, pending.catalog, pending.database)
    }

    private async fetchAllResults() {
        if (!this.queryId) return
        let nextToken: string | null = null
        const maxRows = 10000
        do {
            const params = new URLSearchParams()
            if (nextToken) params.set('nextToken', nextToken)
            params.set('maxResults', '100')

            const response = await fetch(`/api/query/${this.queryId}/results?${params.toString()}`)
            if (!response.ok) {
                throw new Error(await response.text())
            }
            const data = await response.json()
            if (data.columns && this.columns.length === 0) {
                this.columns = data.columns
                this.SetColumns(data.columns)
            }
            if (data.rows && data.rows.length) {
                const remaining = maxRows - this.rowsRead
                const pageRows = data.rows.slice(0, Math.max(0, remaining))
                this.rowsRead += pageRows.length
                this.resultsPages.push(pageRows)
                this.SetResults(this.resultsPages)
                if (this.rowsRead >= maxRows) {
                    this.setErrorMessage('Results were trimmed to 10,000 rows')
                    break
                }
            }
            nextToken = data.nextToken
        } while (nextToken)

        const combined: any[] = []
        this.resultsPages.forEach((page) => page.forEach((row: any) => combined.push(row)))
        this.setAllResults(combined, false)
    }
}

export default AthenaQueryRunner
