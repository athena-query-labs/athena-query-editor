import React, { Component } from 'react'
import { Box, Divider, IconButton, InputBase, Tab as MuiTab, Tabs as MuiTabs } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import TabsEllipsesMenu from './TabsEllipsesMenu'
import Tabs from './Tabs'
import TabInfo from './TabInfo'

interface EnterpriseTabsProps<T extends TabInfo> {
    tabs: Tabs<T>
    newTabLabel?: string
    onTabChange?: (tabId: string) => void
    onTabCreate?: () => string | undefined
    onTabClose?: (tabId: string) => void
    onTabRename?: (tabId: string, newTitle: string) => void
    onTabPin?: (tabId: string, isPinned: boolean) => void
    onTabsReorder?: (newOrder: string[]) => void
    onTabSelectAndPromote?: (tabId: string) => void
}

interface EnterpriseTabsState<T extends TabInfo> {
    tabs: T[]
    currentTabId: string
    editingTabId: string | null
    editingTitle: string
    draggingTabId: string | null
    dragOverTabId: string | null
}

class EnterpriseTabs<T extends TabInfo> extends Component<EnterpriseTabsProps<T>, EnterpriseTabsState<T>> {
    private isUpdating: boolean = false

    constructor(props: EnterpriseTabsProps<T>) {
        super(props)
        this.state = {
            tabs: props.tabs.getTabs(),
            currentTabId: props.tabs.getCurrentTab().id,
            editingTabId: null,
            editingTitle: '',
            draggingTabId: null,
            dragOverTabId: null,
        }
    }

    componentDidMount() {
        this.props.tabs.addChangeListener(this.handleTabsChange)
    }

    componentWillUnmount() {
        this.props.tabs.removeChangeListener(this.handleTabsChange)
    }

    handleTabsChange = () => {
        if (this.isUpdating) return
        this.isUpdating = true

        const newTabs = this.props.tabs.getTabs()
        const newCurrentTab = this.props.tabs.getCurrentTab()

        this.setState(
            {
                tabs: newTabs,
                currentTabId: newCurrentTab.id,
            },
            () => {
                if (newCurrentTab.id !== this.state.currentTabId && this.props.onTabChange) {
                    this.props.onTabChange(newCurrentTab.id)
                }
                this.isUpdating = false
            }
        )
    }

    handleTabClick = (tabId: string) => {
        if (tabId === this.state.currentTabId) return
        this.props.tabs.setCurrentTab(tabId)
    }

    startTabRename = (tabId: string, title: string) => {
        this.setState({
            editingTabId: tabId,
            editingTitle: title,
        })
    }

    cancelTabRename = () => {
        this.setState({
            editingTabId: null,
            editingTitle: '',
        })
    }

    commitTabRename = () => {
        const { editingTabId, editingTitle, tabs } = this.state
        if (!editingTabId) {
            return
        }

        const currentTitle = tabs.find((tab) => tab.id === editingTabId)?.title ?? ''
        const nextTitle = editingTitle.trim()
        if (nextTitle.length > 0 && nextTitle !== currentTitle) {
            this.handleTabRename(editingTabId, nextTitle)
        }

        this.cancelTabRename()
    }

    handleTabClose = (tabId: string) => {
        this.props.tabs.deleteTab(tabId)
        if (this.props.onTabClose) {
            this.props.onTabClose(tabId)
        }
    }

    handleNewTab = () => {
        let newTabId: string | undefined

        // Because tabs are created through the modifying the list of tabs, the list is managed by the containing component
        if (this.props.onTabCreate) {
            // Tabs should be created through
            newTabId = this.props.onTabCreate()
        } else {
            // If no handler is provided, directly add the tab
            const newTab = this.props.tabs.addTab()
            this.props.tabs.setCurrentTab(newTab.id)
            newTabId = newTab.id
        }

        if (newTabId) {
            const createdTabTitle = this.props.tabs.getTabs().find((tab) => tab.id === newTabId)?.title ?? ''
            this.startTabRename(newTabId, createdTabTitle)
        }
    }

    handleTabRename = (tabId: string, newTitle: string) => {
        this.props.tabs.updateTab(tabId, { title: newTitle } as Partial<T>)
        if (this.props.onTabRename) {
            this.props.onTabRename(tabId, newTitle)
        }
    }

    handleTabPin = (tabId: string) => {
        const tab = this.props.tabs.getTabs().find((t) => t.id === tabId)
        if (tab) {
            const newPinnedState = !tab.isPinned
            this.props.tabs.pinTab(tabId, newPinnedState)
            if (this.props.onTabPin) {
                this.props.onTabPin(tabId, newPinnedState)
            }
        }
    }

    handleTabSelectAndPromote = (tabId: string) => {
        if (tabId === this.state.currentTabId) return
        this.props.tabs.moveToFront(tabId)
        this.props.tabs.setCurrentTab(tabId)
        if (this.props.onTabSelectAndPromote) {
            this.props.onTabSelectAndPromote(tabId)
        }
    }

    moveTab = (fromIndex: number, toIndex: number) => {
        const tabs = [...this.state.tabs]
        const [movedTab] = tabs.splice(fromIndex, 1)
        tabs.splice(toIndex, 0, movedTab)
        const newOrder = tabs.map((t) => t.id)
        this.props.tabs.updateTabOrder(newOrder)
        if (this.props.onTabsReorder) {
            this.props.onTabsReorder(newOrder)
        }
    }

    reorderById = (fromTabId: string, toTabId: string) => {
        if (fromTabId === toTabId) {
            return
        }

        const tabs = [...this.state.tabs]
        const fromIndex = tabs.findIndex((tab) => tab.id === fromTabId)
        const toIndex = tabs.findIndex((tab) => tab.id === toTabId)
        if (fromIndex === -1 || toIndex === -1) {
            return
        }

        this.moveTab(fromIndex, toIndex)
    }

    handleTabDragStart = (tabId: string, event: React.DragEvent) => {
        event.stopPropagation()
        event.dataTransfer.setData('text/tab-id', tabId)
        event.dataTransfer.effectAllowed = 'move'
        this.setState({
            draggingTabId: tabId,
            dragOverTabId: null,
        })
    }

    handleTabDragOver = (tabId: string, event: React.DragEvent) => {
        if (!this.state.draggingTabId || this.state.draggingTabId === tabId) {
            return
        }
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (this.state.dragOverTabId !== tabId) {
            this.setState({ dragOverTabId: tabId })
        }
    }

    handleTabDrop = (tabId: string, event: React.DragEvent) => {
        event.preventDefault()
        event.stopPropagation()
        const draggedTabId = event.dataTransfer.getData('text/tab-id') || this.state.draggingTabId
        if (draggedTabId) {
            this.reorderById(draggedTabId, tabId)
        }
        this.setState({
            draggingTabId: null,
            dragOverTabId: null,
        })
    }

    handleTabDragEnd = () => {
        this.setState({
            draggingTabId: null,
            dragOverTabId: null,
        })
    }

    render() {
        const { tabs, currentTabId, editingTabId, editingTitle, draggingTabId, dragOverTabId } = this.state
        const { newTabLabel = '+' } = this.props

        return (
            <Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                    }}
                >
                    <MuiTabs
                        value={currentTabId}
                        variant="scrollable"
                        onChange={(_, id) => this.handleTabClick(id)}
                        sx={{ flexGrow: 1 }}
                    >
                        {tabs.map((tab) => (
                            <MuiTab
                                key={tab.id}
                                value={tab.id}
                                draggable={editingTabId !== tab.id}
                                onDragStart={(event) => this.handleTabDragStart(tab.id, event)}
                                onDragOver={(event) => this.handleTabDragOver(tab.id, event)}
                                onDrop={(event) => this.handleTabDrop(tab.id, event)}
                                onDragEnd={this.handleTabDragEnd}
                                label={
                                    editingTabId === tab.id ? (
                                        <InputBase
                                            autoFocus
                                            value={editingTitle}
                                            onChange={(event) => this.setState({ editingTitle: event.target.value })}
                                            onBlur={this.commitTabRename}
                                            onKeyDown={(event) => {
                                                event.stopPropagation()
                                                if (event.key === 'Enter') {
                                                    event.preventDefault()
                                                    this.commitTabRename()
                                                } else if (event.key === 'Escape') {
                                                    event.preventDefault()
                                                    this.cancelTabRename()
                                                }
                                            }}
                                            onClick={(event) => event.stopPropagation()}
                                            inputProps={{ 'aria-label': `Rename ${tab.title}` }}
                                            sx={{
                                                px: 0.5,
                                                border: 1,
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                fontSize: '0.875rem',
                                                minWidth: 120,
                                            }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                maxWidth: 160,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                            onDoubleClick={(event) => {
                                                event.stopPropagation()
                                                this.startTabRename(tab.id, tab.title)
                                            }}
                                        >
                                            {tab.title}
                                        </Box>
                                    )
                                }
                                sx={{
                                    minHeight: 36,
                                    py: 0,
                                    opacity: draggingTabId === tab.id ? 0.5 : 1,
                                    borderBottom: dragOverTabId === tab.id ? 2 : 0,
                                    borderColor: dragOverTabId === tab.id ? 'primary.main' : 'transparent',
                                }}
                                icon={
                                    <IconButton
                                        component="span"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            this.handleTabClose(tab.id)
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                }
                                iconPosition="end"
                            />
                        ))}
                        <MuiTab
                            value="Add query"
                            icon={
                                <IconButton
                                    component="span"
                                    size="small"
                                    tabIndex={-1}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        this.handleNewTab()
                                    }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            }
                            aria-label="Add tab"
                            sx={{ minWidth: 0, px: 1 }}
                            disableRipple
                        />
                    </MuiTabs>
                    <Box sx={{ ml: 'auto', pr: 1 }}>
                        <TabsEllipsesMenu tabs={tabs} onTabSelect={this.handleTabSelectAndPromote} />
                    </Box>
                </Box>

                <Divider />
            </Box>
        )
    }
}

export default EnterpriseTabs
