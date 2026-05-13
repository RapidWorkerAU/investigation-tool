-- Session undo/redo history is kept in browser memory. Persisted snapshots were
-- not read back on page load and created large, repeated JSONB writes.
drop table if exists ms.map_session_history;
