import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ContractField, ContractTemplate, ServiceContractRecord } from "../types";
import {
  fetchContractByToken,
  fetchTemplateById,
  parseParagraph,
  splitRichText,
  startsWithListMarker,
  submitContract,
} from "../lib/contracts";
import { formatDate } from "../utils";
import { SignaturePad } from "./SignaturePad";
import { useToast } from "./ToastProvider";

interface Props {
  token: string;
}

type LoadState = "loading" | "ready" | "not-found" | "error";

const INDENT_PX = 22;

/** Renders a template body as a paper page: bold/italic markers become <strong>/<em>,
 * leading tabs/^^ become indentation/centering (see parseParagraph), and each {{key}}
 * blank becomes an inline input (editable) or inline filled text (read-only, once
 * submitted). */
function renderPage(
  body: string,
  fields: ContractField[],
  values: Record<string, string>,
  onChange?: (key: string, value: string) => void,
): ReactNode {
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));
  return body.split("\n\n").map((raw, pi) => {
    const { centered, indent, text } = parseParagraph(raw);
    const style: CSSProperties = {};
    if (indent > 0) {
      style.marginLeft = `${indent * INDENT_PX}px`;
      if (startsWithListMarker(text)) {
        style.textIndent = "-1.1em";
        style.paddingLeft = "1.1em";
      }
    }
    const className = [pi === 0 ? "contract-page-title" : null, centered ? "contract-center" : null]
      .filter(Boolean)
      .join(" ");
    return (
      <p key={pi} className={className || undefined} style={style}>
        {splitRichText(text).map((seg, i) => {
        if (seg.type === "bold") return <strong key={i}>{seg.value}</strong>;
        if (seg.type === "italic") return <em key={i}>{seg.value}</em>;
        if (seg.type === "text") return seg.value;

        const field = fieldByKey.get(seg.key);
        if (!field) return null;
        const value = values[seg.key] ?? "";
        if (!onChange) {
          return (
            <span className="contract-blank-filled" key={i}>
              {value || "_____________"}
            </span>
          );
        }
        return (
          <input
            key={i}
            type={field.type === "date" ? "date" : "text"}
            className="contract-blank"
            style={field.type === "text" ? { width: `${Math.max(field.label.length, value.length) + 2}ch` } : undefined}
            value={value}
            placeholder={field.label}
            title={field.label}
            onChange={(e) => onChange(seg.key, e.target.value)}
          />
        );
        })}
      </p>
    );
  });
}

export function PublicContractPage({ token }: Props) {
  const toast = useToast();
  const pageRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [contract, setContract] = useState<ServiceContractRecord | null>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await fetchContractByToken(token);
        if (cancelled) return;
        if (!c) {
          setLoadState("not-found");
          return;
        }
        const tpl = await fetchTemplateById(c.templateId);
        if (cancelled) return;
        setTemplate(tpl);
        setContract(c);
        setLoadState("ready");
      } catch (err) {
        console.error("Failed to load contract:", err);
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function setValue(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    const node = pageRef.current;
    if (!node) return;
    setDownloading(true);
    try {
      // Loaded on demand: jsPDF drags in html2canvas (for a feature most
      // visitors to this link will never click).
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 36;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      await doc.html(node, {
        x: margin,
        y: margin,
        width: pageWidth,
        windowWidth: node.scrollWidth,
        autoPaging: "text",
      });
      const slug = (template?.title ?? "contract").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      doc.save(`${slug}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Couldn't create the PDF. Try printing instead.");
    } finally {
      setDownloading(false);
    }
  }

  const toolbar = (
    <div className="contract-toolbar">
      <button type="button" className="contract-toolbar-btn" onClick={handlePrint}>
        Print
      </button>
      <button type="button" className="contract-toolbar-btn" onClick={handleDownload} disabled={downloading}>
        {downloading ? "Preparing…" : "Download PDF"}
      </button>
    </div>
  );

  async function handleSubmit() {
    const missing = (template?.fields ?? []).find((f) => !values[f.key]?.trim());
    if (missing) {
      setError(`Please fill in "${missing.label}".`);
      return;
    }
    if (!agreed) {
      setError("Please check the box confirming you agree to the terms above.");
      return;
    }
    if (!signature) {
      setError("Please sign above before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitContract(token, { fieldValues: values, agreed, signatureDataUrl: signature });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit this contract. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="contract-screen">
        <p className="contract-status">Loading…</p>
      </div>
    );
  }

  if (loadState === "not-found") {
    return (
      <div className="contract-screen">
        <div className="contract-page">
          <h1 className="contract-title">Link not found</h1>
          <p className="contract-status">
            This contract link doesn't match anything. Double-check the link, or contact whoever sent it to you.
          </p>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="contract-screen">
        <div className="contract-page">
          <h1 className="contract-title">Something went wrong</h1>
          <p className="contract-status">Couldn't load this contract right now. Please try again in a moment.</p>
        </div>
      </div>
    );
  }

  const alreadyDone = submitted || contract?.status === "completed";

  if (alreadyDone) {
    const finalValues = contract?.status === "completed" ? contract.fieldValues : values;
    return (
      <div className="contract-screen">
        <p className="contract-status contract-status--banner">
          {submitted
            ? "Thanks -- this contract has been submitted and signed."
            : `This contract was already signed${contract?.signedAt ? ` on ${formatDate(contract.signedAt.slice(0, 10))}` : ""}.`}
        </p>
        {toolbar}
        <div className="contract-page" ref={pageRef}>
          {renderPage(template?.body ?? "", template?.fields ?? [], finalValues)}
        </div>
      </div>
    );
  }

  return (
    <div className="contract-screen">
      {toolbar}
      <div className="contract-page" ref={pageRef}>
        {renderPage(template?.body ?? "", template?.fields ?? [], values, setValue)}
      </div>

      <div className="contract-sign-panel">
        <h2 className="contract-section-title">Signature</h2>
        <SignaturePad onChange={setSignature} />

        <label className="checkbox-label contract-agree">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I have read and agree to the terms above.
        </label>

        {error && <p className="field-error">{error}</p>}

        <button type="button" className="btn-primary contract-submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit & sign"}
        </button>
      </div>
    </div>
  );
}
