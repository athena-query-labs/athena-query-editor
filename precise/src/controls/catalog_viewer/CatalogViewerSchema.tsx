import React from 'react'
import { Box, IconButton, Typography, Tooltip } from '@mui/material'
import { TreeItem } from '@mui/x-tree-view'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Schema from '../../schema/Schema'
import Table from '../../schema/Table'
import CatalogViewerTable from './CatalogViewerTable'
import TableReference from '../../schema/TableReference'
import { buildPath } from './ViewerState'

interface SchemaProps {
    catalogName: string
    schema: Schema
    filterText: string
    isVisible: (path: string) => boolean
    isExpanded: (path: string) => boolean
    isLoading: boolean
    hasMatchingChildren: (path: string) => boolean
    isActive: boolean
    isSchemaLoading: boolean
    schemaError?: string
    isSchemaLoaded: boolean
    onGenerateQuery?: (
        queryType: string,
        tableRef: TableReference | null,
        catalogName?: string,
        schemaName?: string
    ) => void
    onSchemaExpand?: (path: string) => void
}

const CatalogViewerSchema: React.FC<SchemaProps> = ({
    catalogName,
    schema,
    filterText,
    isVisible,
    isExpanded,
    isLoading,
    hasMatchingChildren,
    isActive,
    isSchemaLoading,
    schemaError,
    isSchemaLoaded,
    onGenerateQuery,
    onSchemaExpand,
}) => {
    const schemaPath = buildPath.schema(catalogName, schema.getName())

    // Check visibility using the passed down helper
    if (filterText && !isVisible(schemaPath)) {
        return null
    }

    const handleGenerateQuery = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent toggling expansion
        if (onGenerateQuery) {
            onGenerateQuery('SET_SCHEMA', null, catalogName, schema.getName())
        }
        onSchemaExpand?.(schemaPath)
    }

    const tables = Array.from(schema.getTables().values()).sort((a: Table, b: Table) =>
        a.getName().localeCompare(b.getName())
    )

    return (
        <TreeItem
            key={schemaPath}
            itemId={schemaPath}
            slots={{
                icon: StorageOutlinedIcon,
            }}
            label={
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Typography
                        fontSize="small"
                        sx={{
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? 'primary.main' : 'inherit',
                        }}
                    >
                        {schema.getName()}
                    </Typography>

                    <IconButton
                        title="Set this schema as default schema"
                        size="small"
                        sx={{ ml: 'auto' }}
                        onClick={handleGenerateQuery}
                        disabled={isLoading}
                    >
                        <ChevronRightIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Box>
            }
            slotProps={{
                label: {
                    style: {
                        overflow: 'visible',
                    },
                },
            }}
        >
            {schemaError ? (
                <TreeItem
                    itemId={`${schemaPath}.__error`}
                    label={
                        <Tooltip title={schemaError}>
                            <Typography fontSize="small" color="error.main">
                                Failed to load tables
                            </Typography>
                        </Tooltip>
                    }
                />
            ) : isSchemaLoading ? (
                <TreeItem
                    itemId={`${schemaPath}.__loading`}
                    label={
                        <Typography fontSize="small" color="text.secondary">
                            Loading tables...
                        </Typography>
                    }
                />
            ) : tables.length === 0 ? (
                <TreeItem
                    itemId={`${schemaPath}.__empty`}
                    label={
                        <Typography fontSize="small" color="text.secondary">
                            {isSchemaLoaded ? 'No tables found' : 'Click to load tables'}
                        </Typography>
                    }
                />
            ) : (
                tables.map((table: Table) => {
                    const tablePath = buildPath.table(catalogName, schema.getName(), table.getName())

                    return (
                        <CatalogViewerTable
                            key={tablePath}
                            tableRef={new TableReference(catalogName, schema.getName(), table.getName())}
                            tableType={table.getType()}
                            filterText={filterText}
                            isExpanded={isExpanded(tablePath)}
                            isVisible={isVisible}
                            isLoading={isLoading}
                            hasMatchingChildren={hasMatchingChildren}
                            onGenerateQuery={onGenerateQuery}
                        />
                    )
                })
            )}
        </TreeItem>
    )
}

export default CatalogViewerSchema
