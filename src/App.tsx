import { useRef, useState } from "react";
import { ContextModel } from "./models/context-model";
import { MolstarViewer } from "./extension/MolstarViewer";

export default function App() {
  const context = useRef<ContextModel>();
  if (!context.current) context.current = new ContextModel();

  return (
    <div className="h-screen w-screen p-5">
      <div className="flex flex-col">
        <ViewControls />
        <hr className="my-4" />
        <div className="h-[800px] w-full outline outline-1">
          <MolstarViewer context={context.current} />
        </div>
      </div>
    </div>
  );
}

function Input({
  name,
  title,
  id,
  value,
  onChange,
  checked,
}: {
  name: string;
  id: string;
  value: string;
  title: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-row gap-2" title={title}>
      <input
        type="radio"
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        checked={checked}
      />
      <label htmlFor={id}>{value}</label>
    </div>
  );
}

function ViewControls() {
  const [view, setView] = useState<"cartoon" | "bas" | "surface">("cartoon");
  const [coloring, setColoring] = useState<"structure" | "confidence">(
    "structure"
  );
  const [showOptimized, setShowOptimized] = useState<boolean>(false);

  return (
    <div className="flex flex-row">
      <div className="flex flex-col basis-1/2">
        <legend className="font-bold col">View</legend>

        <Input
          name="view"
          id="view_cartoon"
          value="Cartoon"
          title="Cartoon representation."
          onChange={() => setView("cartoon")}
          checked={view === "cartoon"}
        />

        <Input
          name="view"
          id="view_surface"
          value="Surface"
          title="Surface representation."
          onChange={() => setView("surface")}
          checked={view === "surface"}
        />

        <Input
          name="view"
          id="view_bas"
          value="Ball &amp; Stick"
          title="Ball &amp; Stick representation."
          onChange={() => setView("bas")}
          checked={view === "bas"}
        />

        <div className="flex flex-row gap-2">
          <input
            type="checkbox"
            id="view_non_optimized"
            onChange={() => setShowOptimized(!showOptimized)}
            checked={showOptimized}
            disabled={view !== "bas"}
          />
          <label htmlFor="view_non_optimized">
            Add non-optimized structure
          </label>
        </div>
      </div>

      <div className="flex flex-col">
        <legend className="font-bold">Coloring</legend>

        <Input
          name="colors"
          id="colors_structure"
          value="Structure"
          title="Use coloring based on the structure"
          onChange={() => setColoring("structure")}
          checked={coloring === "structure"}
        />

        <Input
          name="colors"
          id="coloring_confidence"
          value="Model confidence"
          title="Use coloring based on AlphaFold model confidence (according pLDDT score)."
          onChange={() => setColoring("confidence")}
          checked={coloring === "confidence"}
        />
      </div>
    </div>
  );
}
