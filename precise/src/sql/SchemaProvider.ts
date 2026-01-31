import Column from '../schema/Column'
import Catalog from './../schema/Catalog'
import Schema from './../schema/Schema'
import Table from './../schema/Table'
import TableReference from './../schema/TableReference'

class SchemaProvider {
    // error message from last catalog fetch so that it can be displayed to the user
    public static lastSchemaFetchError: string | undefined = undefined

    static catalogs: Map<string, Catalog> = new Map<string, Catalog>()
    // map of fully qualified table name to tables
    static tables: Map<string, Table> = new Map<string, Table>()

    static getTableNameList(catalogFilter: string | undefined, schemaFilter: string | undefined): string[] {
        // get list from catalogs, because tables may not be resolved
        const tableNames: string[] = []
        for (const [key, value] of this.catalogs) {
            if (key === catalogFilter || !catalogFilter) {
                for (const [schemaName, schema] of value.getSchemas()) {
                    if (schemaName === schemaFilter || !schemaFilter) {
                        for (const [tableName, table] of schema.getTables()) {
                            tableNames.push(key + '.' + schemaName + '.' + tableName)
                        }
                    }
                }
            }
        }
        return tableNames
    }

    static isTableCached(tableRef: TableReference) {
        if (this.tables.has(tableRef.fullyQualified)) {
            // check for columns
            const table = this.tables.get(tableRef.fullyQualified)
            if (table && table.getColumns().length > 0) {
                return true
            }
        }
        return false
    }

    static getTableWithCache(tableRef: TableReference, callback: any): Table | undefined {
        if (SchemaProvider.isTableCached(tableRef)) {
            const table: Table | undefined = this.tables.get(tableRef.fullyQualified)
            if (callback) {
                callback(table)
            }
            return table
        } else {
            SchemaProvider.getTableRefreshCache(tableRef, callback)
            return undefined
        }
    }

    static getTableIfCached(tableRef: TableReference) {
        if (SchemaProvider.isTableCached(tableRef)) {
            return this.tables.get(tableRef.fullyQualified)
        }
        // async operation to refresh cache but return null in the meantime
        SchemaProvider.getTableRefreshCache(tableRef, (table: Table) => {})
        return null
    }

    static populateCatalogsAndRefreshTableList(
        callback: ((nextCatalogs: Map<string, Catalog>) => void) | null = null,
        errorCallback: ((error: string) => void) | null = null
    ) {
        Promise.resolve()
            .then(async () => {
                const catalogResponse = await fetch('/api/metadata/catalogs')
                if (!catalogResponse.ok) {
                    throw new Error(await catalogResponse.text())
                }
                const catalogData = await catalogResponse.json()
                const catalogs = catalogData.catalogs ?? []
                if (!catalogs.length) {
                    throw new Error('No catalogs available')
                }

                for (const catalogName of catalogs) {
                    const catalog = new Catalog(catalogName, 'athena')
                    if (!this.catalogs.has(catalog.getName())) {
                        this.catalogs.set(catalog.getName(), catalog)
                    }

                    const dbResponse = await fetch('/api/metadata/databases')
                    if (!dbResponse.ok) {
                        throw new Error(await dbResponse.text())
                    }
                    const dbData = await dbResponse.json()
                    const databases = dbData.databases ?? []

                    for (const databaseName of databases) {
                        const schema = catalog.getOrAdd(new Schema(databaseName))
                        const tablesResponse = await fetch(
                            `/api/metadata/tables?database=${encodeURIComponent(databaseName)}`
                        )
                        if (!tablesResponse.ok) {
                            throw new Error(await tablesResponse.text())
                        }
                        const tablesData = await tablesResponse.json()
                        const tables = tablesData.tables ?? []
                        for (const tableName of tables) {
                            const table = new Table(tableName)
                            schema.addTable(table)
                            this.tables.set(`${catalogName}.${databaseName}.${tableName}`, table)
                        }
                    }
                }

                this.lastSchemaFetchError = undefined
                callback?.(new Map(this.catalogs))
            })
            .catch((error: Error) => {
                this.lastSchemaFetchError = error.toString()
                errorCallback?.(error.toString())
            })
    }

    /* callback returns a table type */
    static async getTableRefreshCache(tableRef: TableReference, callback: (table: Table) => void) {
        try {
            const response = await fetch(
                `/api/metadata/columns?database=${encodeURIComponent(tableRef.schemaName)}&table=${encodeURIComponent(
                    tableRef.tableName
                )}`
            )
            if (!response.ok) {
                throw new Error(await response.text())
            }
            const data = await response.json()
            const table = new Table(tableRef.tableName)
            for (const col of data.columns ?? []) {
                table.getColumns().push(new Column(col.name, col.type, col.comment || '', ''))
            }
            this.tables.set(tableRef.fullyQualified, table)
            const catalog = tableRef.getCatalog()
            const schema = tableRef.getSchema()
            if (catalog && schema) {
                schema.addTable(table)
            }
            callback(table)
        } catch (error) {
            console.log('Error fetching table info:', error)
            this.fallbackToDescribe(tableRef, callback)
        }
    }

    private static fallbackToDescribe(tableRef: TableReference, callback: (table: Table) => void) {
        const table = new Table(tableRef.tableName)
        table.setError('Failed to load columns')
        callback(table)
    }
}

export default SchemaProvider
