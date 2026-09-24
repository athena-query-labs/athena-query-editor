// The package entry point registers the standalone editor contributions (suggest widget, hover, find).
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'

export * from 'monaco-editor'

// The Trino SQL language runs on the main thread, so the generic editor worker is enough.
self.MonacoEnvironment = { getWorker: () => new EditorWorker() }
