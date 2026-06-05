import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./LabDescription.css";

interface Props {
  markdown: string;
}

export default function LabDescription({ markdown }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lab-desc">
      <button
        className="lab-desc-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>About this demo</span>
        <span className={`lab-desc-chevron${open ? " open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="lab-desc-body">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
