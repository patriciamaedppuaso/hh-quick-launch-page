import { useEffect, useRef, useState } from "react";
import type { ContractTemplate, ServiceContractRecord } from "../types";
import { fetchContractByToken, fetchContractorSignature, fetchTemplateById, submitContract } from "../lib/contracts";
import { formatDate } from "../utils";
import { renderContractPage } from "./ContractDocument";
import { SignaturePad } from "./SignaturePad";
import { useToast } from "./ToastProvider";

interface Props {
  token: string;
}

type LoadState = "loading" | "ready" | "not-found" | "error";

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
  const [contractorSignature, setContractorSignature] = useState<string | null>(null);

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
        const [tpl, contractorSig] = await Promise.all([fetchTemplateById(c.templateId), fetchContractorSignature()]);
        if (cancelled) return;
        setTemplate(tpl);
        setContract(c);
        setValues(c.fieldValues);
        setContractorSignature(contractorSig);
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
      // Loaded on demand: drags in html2canvas (for a feature most visitors
      // to this link will never click). Rasterizing the actual rendered page
      // (rather than jsPDF's own HTML/CSS interpreter) avoids it mangling the
      // indentation and inline blanks -- it just captures pixels, so the PDF
      // always matches exactly what's on screen.
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
      // DOM-px -> canvas-px factor, robust against devicePixelRatio (don't assume it equals `scale`).
      const scaleY = canvas.height / node.scrollHeight;

      // Never cut a page mid-paragraph: collect each paragraph's bottom edge
      // (in canvas px) as the only places a page break is allowed to land.
      const breakpoints = Array.from(node.children)
        .map((child) => Math.round(((child as HTMLElement).offsetTop + (child as HTMLElement).offsetHeight) * scaleY))
        .filter((y) => y > 0 && y <= canvas.height);

      const pdf = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 40;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const pxPerPt = canvas.width / pageWidth;
      const maxSliceHeightPx = pageHeight * pxPerPt;

      let cursor = 0;
      let firstPage = true;
      while (cursor < canvas.height) {
        const limit = cursor + maxSliceHeightPx;
        // Latest paragraph break that still fits on this page; if none fit
        // (a single paragraph taller than a page), fall back to a raw cut.
        const bestBreak = breakpoints.filter((y) => y > cursor && y <= limit).pop();
        const sliceEnd = Math.min(bestBreak ?? limit, canvas.height);
        const sliceHeight = sliceEnd - cursor;

        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        slice.getContext("2d")?.drawImage(canvas, 0, cursor, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        if (!firstPage) pdf.addPage();
        firstPage = false;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, pageWidth, sliceHeight / pxPerPt);

        cursor = sliceEnd;
      }

      const slug = (template?.title ?? "contract").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      pdf.save(`${slug}.pdf`);
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
          {renderContractPage(
            template?.body ?? "",
            template?.fields ?? [],
            finalValues,
            undefined,
            signature ?? contract?.signatureDataUrl,
            true,
            contractorSignature,
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="contract-screen">
      {toolbar}
      <div className="contract-page" ref={pageRef}>
        {renderContractPage(template?.body ?? "", template?.fields ?? [], values, setValue, signature, true, contractorSignature)}
      </div>

      <div className="contract-sign-panel">
        <h2 className="contract-section-title">Signature</h2>
        <SignaturePad onChange={setSignature} />

        <label className="checkbox-label contract-agree">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I have read and agree to the terms above.
        </label>

        {error && <p className="field-error">{error}</p>}

        <button
          type="button"
          className="btn-primary contract-submit"
          onClick={handleSubmit}
          disabled={submitting || !agreed}
        >
          {submitting ? "Submitting…" : "Submit & sign"}
        </button>
      </div>
    </div>
  );
}
