import type { CSSProperties, ReactNode } from "react";
import type { ContractField } from "../types";
import { parseParagraph, splitRichText, startsWithListMarker } from "../lib/contracts";

const INDENT_PX = 22;

/** Renders one segment-stream (bold/italic -> <strong>/<em>, {{key}} -> inline input or
 * inline filled text) shared by both normal paragraphs and two-column cells. */
function renderInline(
  text: string,
  fieldByKey: Map<string, ContractField>,
  values: Record<string, string>,
  onChange: ((key: string, value: string) => void) | undefined,
  keyPrefix: string,
  signatureUrl?: string | null,
  showSignatureHint = true,
  contractorSignatureUrl?: string | null,
): ReactNode {
  return splitRichText(text).map((seg, i) => {
    const key = `${keyPrefix}-${i}`;
    if (seg.type === "bold") return <strong key={key}>{seg.value}</strong>;
    if (seg.type === "italic") return <em key={key}>{seg.value}</em>;
    if (seg.type === "text") return seg.value;

    if (seg.key === "signature") {
      if (signatureUrl) {
        return <img key={key} src={signatureUrl} alt="Signature" className="contract-inline-signature" />;
      }
      if (onChange && showSignatureHint) {
        return (
          <em key={key} className="contract-signature-hint">
            (refer to the box below for signature)
          </em>
        );
      }
      return (
        <span className="contract-blank-filled" key={key}>
          _____________
        </span>
      );
    }

    if (seg.key === "contractor_signature") {
      return contractorSignatureUrl ? (
        <img key={key} src={contractorSignatureUrl} alt="Signature" className="contract-inline-signature" />
      ) : (
        <span className="contract-blank-filled" key={key}>
          _____________
        </span>
      );
    }

    const field = fieldByKey.get(seg.key);
    if (!field) return null;
    const value = values[seg.key] ?? "";
    if (!onChange) {
      return (
        <span className="contract-blank-filled" key={key}>
          {value || "_____________"}
        </span>
      );
    }
    return (
      <input
        key={key}
        type={field.type === "date" ? "date" : "text"}
        className="contract-blank"
        style={field.type === "text" ? { width: `${Math.max(field.label.length, value.length) + 2}ch` } : undefined}
        value={value}
        placeholder={field.label}
        title={field.label}
        onChange={(e) => onChange(seg.key, e.target.value)}
      />
    );
  });
}

/** Renders a template body as a paper page: bold/italic markers become <strong>/<em>,
 * leading tabs/^^/## become indentation/centering/two-column rows (see parseParagraph),
 * and each {{key}} blank becomes an inline input (editable) or inline filled text
 * (read-only, once submitted). Shared by the public fill/view page and the staff
 * "fill in details" editor, so both show the exact same document. */
export function renderContractPage(
  body: string,
  fields: ContractField[],
  values: Record<string, string>,
  onChange?: (key: string, value: string) => void,
  signatureUrl?: string | null,
  showSignatureHint = true,
  contractorSignatureUrl?: string | null,
): ReactNode {
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));
  return body.split("\n\n").map((raw, pi) => {
    const { centered, twoColumn, indent, text } = parseParagraph(raw);

    if (twoColumn) {
      return (
        <div key={pi} className="contract-two-col">
          {text.split("\n").map((line, li) => {
            const [left, right] = line.split("|").map((s) => s.trim());
            return (
              <div className="contract-two-col-row" key={li}>
                <span className="contract-two-col-cell">
                  {renderInline(
                    left,
                    fieldByKey,
                    values,
                    onChange,
                    `${pi}-${li}-l`,
                    signatureUrl,
                    showSignatureHint,
                    contractorSignatureUrl,
                  )}
                </span>
                <span className="contract-two-col-cell">
                  {right != null
                    ? renderInline(
                        right,
                        fieldByKey,
                        values,
                        onChange,
                        `${pi}-${li}-r`,
                        signatureUrl,
                        showSignatureHint,
                        contractorSignatureUrl,
                      )
                    : null}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

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
        {renderInline(text, fieldByKey, values, onChange, `${pi}`, signatureUrl, showSignatureHint, contractorSignatureUrl)}
      </p>
    );
  });
}
