import QueryInfo from './QueryInfo'
import QueryType from './QueryType'
import { v4 as uuidv4 } from 'uuid'
import Tabs from './../controls/tabs/Tabs'

class Queries extends Tabs<QueryInfo> {
    private static readonly CURRENT_QUERY_TAB_ID_KEY = 'current_query_tab_id'

    constructor() {
        super()

        const savedQueryId = this.getSavedCurrentQueryId()
        if (savedQueryId && this.getTabs().some((query) => query.id === savedQueryId)) {
            super.setCurrentTab(savedQueryId)
        }

        this.addChangeListener(this.persistCurrentQueryTabId)
        this.persistCurrentQueryTabId()
    }

    private getSavedCurrentQueryId(): string | null {
        return localStorage.getItem(Queries.CURRENT_QUERY_TAB_ID_KEY)
    }

    private persistCurrentQueryTabId = (): void => {
        localStorage.setItem(Queries.CURRENT_QUERY_TAB_ID_KEY, this.getCurrentQuery().id)
    }

    private getNextDefaultQueryTitle(): string {
        // Reuse the smallest missing positive index so names stay compact: Query 1, Query 2, ...
        const usedIndices = new Set<number>()
        for (const query of this.tabs) {
            // Only count titles that already follow the "Query N" pattern.
            const match = query.title.match(/^query\s+(\d+)$/i)
            if (!match) {
                continue
            }
            const parsed = Number.parseInt(match[1], 10)
            if (Number.isNaN(parsed) || parsed < 1) {
                continue
            }
            usedIndices.add(parsed)
        }

        let nextIndex = 1
        while (usedIndices.has(nextIndex)) {
            nextIndex += 1
        }

        return `Query ${nextIndex}`
    }

    loadTabs(): QueryInfo[] {
        const queryList: QueryInfo[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('query_')) {
                const value = localStorage.getItem(key)
                if (value) {
                    try {
                        const queryInfo = JSON.parse(value)
                        queryList.push(
                            new QueryInfo(
                                queryInfo.title,
                                queryInfo.type,
                                queryInfo.query,
                                queryInfo.id,
                                queryInfo.isPinned,
                                queryInfo.catalog,
                                queryInfo.schema
                            )
                        )
                    } catch (e) {
                        console.error('Error parsing stored query:', e)
                        localStorage.removeItem(key)
                    }
                }
            }
        }

        // Handle query from URL
        const urlParams = new URLSearchParams(window.location.search)
        const query = urlParams.get('q')
        const title = urlParams.get('n') ?? 'Imported Query'
        if (query) {
            const newQueryId = uuidv4()
            const newQuery = new QueryInfo(title, QueryType.FROM_QUERY_STRING, query, newQueryId, false)
            queryList.push(newQuery)
            this.saveTab(newQuery)
        }

        return queryList
    }

    saveTabs(): void {
        this.tabs.forEach((query) => this.saveTab(query))
    }

    private saveTab(query: QueryInfo): void {
        localStorage.setItem(`query_${query.id}`, JSON.stringify(query))
    }

    deleteTabFromStorage(tabId: string): void {
        localStorage.removeItem(`query_${tabId}`)
    }

    createNewTab(): QueryInfo {
        return new QueryInfo(this.getNextDefaultQueryTitle(), QueryType.USER_ADDED, '', uuidv4(), false)
    }

    // Query-specific methods

    getCurrentQuery(): QueryInfo {
        return this.getCurrentTab()
    }

    addQuery(front: boolean = false, title?: string): QueryInfo {
        const resolvedTitle = title && title.trim().length > 0 ? title : this.getNextDefaultQueryTitle()
        return this.addTab(front, resolvedTitle)
    }

    updateQuery(queryId: string, updates: Partial<QueryInfo>): void {
        this.updateTab(queryId, updates)
    }

    deleteQuery(queryId: string): void {
        this.deleteTab(queryId)
    }

    setCurrentQuery(queryId: string): void {
        this.setCurrentTab(queryId)
    }

    updateQueryOrder(newOrder: string[]): void {
        this.updateTabOrder(newOrder)
    }

    moveQueryToFront(queryId: string): void {
        this.moveToFront(queryId)
    }

    // Additional query-specific method
    getQueryContent(queryId: string): string {
        const query = this.tabs.find((q) => q.id === queryId)
        return query ? query.query : ''
    }
}

export default Queries
