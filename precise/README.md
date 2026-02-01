# Trino Query UI

A reusable React component as a query interface for the SQL query engine
[Trino](https://trino.io/). Browse connected catalogs, write SQL queries,
execute the queries and inspect result data all in a web application connected
to your Trino cluster.

The component can be embedded into any React application and configured to proxy
requests to a local or remote Trino cluster.

Find more details including using the component, screenshots, development and
more in our [source code repository](https://github.com/simpligility/trino-query-ui).

## UI Layout Structure (Frontend)

Top-level layout and nesting (from outer to inner):

1) `precise/src/main.tsx`
   - **Root App container**: a grid with rows `auto 1fr auto`
   - **Header row**: title (`Athena query editor - Example app`) + theme toggle
   - **Editor row**: `QueryEditor` mounted inside a `div` that measures height

2) `precise/src/QueryEditor.tsx`
   - **Root Box**: `display: grid` with columns `[drawer, main]`
     - When open: `gridTemplateColumns: "300px 1fr"`
     - When collapsed: `gridTemplateColumns: "0px 1fr"`
   - **Left Drawer**: tabs for Catalog/History, uses `position: static` so it participates in grid layout
   - **Main content**: `QueryCell` (right side, always `1fr`)

3) `precise/src/QueryCell.tsx`
   - **Toolbar**: Run/Stop, title, Catalog/Database status area, collapse button
   - **QueryEditorPane**: SQL editor
   - **ResultSet**: query results

Note: the header (title + theme toggle) is outside `QueryEditor`, so it should not be affected by drawer collapse/expand.
