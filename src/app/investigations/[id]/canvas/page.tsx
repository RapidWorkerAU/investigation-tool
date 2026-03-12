"use client";

import { useMemo } from "react";
import "@xyflow/react/dist/style.css";
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider } from "@xyflow/react";

export default function InvestigationCanvasPage() {
  const initialNodes = useMemo(
    () => [
      { id: "1", position: { x: 120, y: 120 }, data: { label: "Incident Factor" }, type: "default" },
      { id: "2", position: { x: 420, y: 120 }, data: { label: "Control / Barrier" }, type: "default" },
    ],
    []
  );
  const initialEdges = useMemo(() => [{ id: "e1-2", source: "1", target: "2", label: "leads_to" }], []);

  return (
    <div className="h-[75vh] rounded border bg-white">
      <ReactFlowProvider>
        <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
