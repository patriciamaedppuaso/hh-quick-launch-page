import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { ContractField, ContractTemplate, ServiceContractRecord } from "../types";
import { Icon } from "../icons";
import {
  createContract,
  deleteContract,
  fetchContractorSignature,
  fetchContracts,
  fetchTemplates,
  fillTemplate,
  parseParagraph,
  saveContractorSignature,
  splitRichText,
  startsWithListMarker,
  saveTemplate,
  updateContractFieldValues,
} from "../lib/contracts";
import { formatDate, initialOf } from "../utils";
import { renderContractPage } from "./ContractDocument";
import { Modal } from "./Modal";
import { DetailModal } from "./DetailModal";
import { SignaturePad } from "./SignaturePad";
import { useToast } from "./ToastProvider";

interface Props {
  canManage: boolean;
  currentUserName: string;
}

function shareUrl(token: string): string {
  return `${window.location.origin}/contract/${token}`;
}

function recipientLabel(c: ServiceContractRecord, templates: ContractTemplate[]): string {
  const tpl = templates.find((t) => t.id === c.templateId);
  const nameKey = tpl?.fields.find((f) => /name/i.test(f.key) && !/signer|guarantor_license/i.test(f.key));
  const fromValues = nameKey ? c.fieldValues[nameKey.key] : undefined;
  return fromValues || c.internalLabel || "Untitled contract";
}

export function ContractsSection({ canManage, currentUserName }: Props) {
  const toast = useToast();
  const [contracts, setContracts] = useState<ServiceContractRecord[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [justCreated, setJustCreated] = useState<ServiceContractRecord | null>(null);
  const [viewing, setViewing] = useState<ServiceContractRecord | null>(null);
  const [fillingContract, setFillingContract] = useState<ServiceContractRecord | null>(null);
  const [fillValues, setFillValues] = useState<Record<string, string>>({});
  const [managingTemplates, setManagingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateFields, setTemplateFields] = useState<ContractField[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [contractorSignature, setContractorSignature] = useState<string | null>(null);
  const [savingContractorSignature, setSavingContractorSignature] = useState(false);
  const [draftContractorSignature, setDraftContractorSignature] = useState<string | null>(null);

  async function reload() {
    const [nextContracts, nextTemplates, contractorSig] = await Promise.all([
      fetchContracts(),
      fetchTemplates(),
      fetchContractorSignature(),
    ]);
    setContracts(nextContracts);
    setTemplates(nextTemplates);
    setContractorSignature(contractorSig);
    if (!newTemplateId && nextTemplates.length > 0) setNewTemplateId(nextTemplates[0].id);
  }

  useEffect(() => {
    reload()
      .catch((err) => toast.error(err instanceof Error ? err.message : "Couldn't load contracts."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const templateById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  async function handleCreate() {
    if (!newTemplateId) {
      toast.error("Add a contract template first.");
      return;
    }
    if (!newLabel.trim()) {
      toast.error("Give this contract a title.");
      return;
    }
    setBusy(true);
    try {
      const record = await createContract(newTemplateId, newLabel.trim(), currentUserName);
      setContracts((prev) => [record, ...prev]);
      setCreating(false);
      setNewLabel("");
      setJustCreated(record);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the contract.");
    } finally {
      setBusy(false);
    }
  }

  function openFillValues(c: ServiceContractRecord) {
    setFillingContract(c);
    setFillValues({ ...c.fieldValues });
  }

  async function handleSaveFieldValues() {
    if (!fillingContract) return;
    setBusy(true);
    try {
      await updateContractFieldValues(fillingContract.id, fillValues);
      setContracts((prev) => prev.map((c) => (c.id === fillingContract.id ? { ...c, fieldValues: fillValues } : c)));
      setFillingContract(null);
      toast.success("Details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the details.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveContractorSignature() {
    if (!draftContractorSignature) return;
    setSavingContractorSignature(true);
    try {
      await saveContractorSignature(draftContractorSignature);
      setContractorSignature(draftContractorSignature);
      setDraftContractorSignature(null);
      toast.success("Signature saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the signature.");
    } finally {
      setSavingContractorSignature(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the contract.");
    } finally {
      setBusy(false);
    }
  }

  function openTemplateEditor(tpl: ContractTemplate) {
    setEditingTemplateId(tpl.id);
    setTemplateTitle(tpl.title);
    setTemplateBody(tpl.body);
    setTemplateFields(tpl.fields);
  }

  function updateField(index: number, patch: Partial<ContractField>) {
    setTemplateFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    setTemplateFields((prev) => prev.filter((_, i) => i !== index));
  }

  function addField() {
    setTemplateFields((prev) => [...prev, { key: "", label: "", type: "text" }]);
  }

  async function handleSaveTemplate() {
    if (!editingTemplateId) return;
    setBusy(true);
    try {
      await saveTemplate(editingTemplateId, templateTitle.trim(), templateBody, templateFields);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplateId ? { ...t, title: templateTitle.trim(), body: templateBody, fields: templateFields } : t,
        ),
      );
      setEditingTemplateId(null);
      toast.success("Template saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the template.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="items-empty">Loading contracts…</p>;
  }

  return (
    <div>
      <div className="items-toolbar">
        {canManage && (
          <button type="button" className="card-edit-btn" title="Manage contract templates" onClick={() => setManagingTemplates(true)}>
            <Icon name="edit" />
          </button>
        )}
        {canManage && (
          <button
            type="button"
            className="btn-primary items-add-btn"
            onClick={() => setCreating(true)}
            disabled={templates.length === 0}
          >
            + New contract
          </button>
        )}
      </div>

      {templates.length === 0 && canManage && (
        <p className="items-empty">No contract templates yet. That shouldn't happen -- contact support.</p>
      )}

      {contracts.length === 0 ? (
        <p className="items-empty">No contracts yet. Create one to get a shareable link.</p>
      ) : (
        <div className="items-list">
          {contracts.map((c) => (
            <div className="items-row items-row--clickable" key={c.id} onClick={() => setViewing(c)}>
              <span className="contact-avatar" style={{ background: "var(--surface-soft)", color: "var(--teal-strong)" }}>
                {initialOf(recipientLabel(c, templates))}
              </span>
              <div className="items-row-text">
                <span className="items-row-name">{recipientLabel(c, templates)}</span>
                <span className="items-row-desc">
                  {[templateById.get(c.templateId)?.title, `Created ${formatDate(c.createdAt.slice(0, 10))}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <span
                className="status-pill"
                style={
                  c.status === "completed"
                    ? {
                        background: "color-mix(in srgb, var(--success) 18%, var(--surface-soft))",
                        color: "color-mix(in srgb, var(--success) 70%, var(--text))",
                      }
                    : { background: "var(--surface-soft)", color: "var(--text-secondary)" }
                }
              >
                {c.status === "completed" ? "Completed" : "Pending"}
              </span>
              {canManage && (
                <div
                  className={`items-row-manage${confirmDeleteId === c.id ? " items-row-manage--active" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="icon-btn-sm"
                    aria-label="Copy share link"
                    title="Copy share link"
                    onClick={() => copyLink(c.shareToken)}
                  >
                    <Icon name="copy" />
                  </button>
                  {c.status !== "completed" && (
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label="Fill in details"
                      title="Fill in details"
                      onClick={() => openFillValues(c)}
                    >
                      <Icon name="clipboard" />
                    </button>
                  )}
                  {confirmDeleteId === c.id ? (
                    <span className="confirm-delete">
                      <button type="button" className="btn-danger-sm" onClick={() => handleDelete(c.id)} disabled={busy}>
                        Delete
                      </button>
                      <button type="button" className="btn-secondary-sm" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn-sm icon-btn-danger"
                      aria-label="Delete contract"
                      onClick={() => setConfirmDeleteId(c.id)}
                    >
                      <Icon name="trash" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New contract">
        <div className="form-card">
          <p className="form-hint">Creates a blank contract and a link you can share. The recipient fills it in and signs.</p>
          {templates.length > 1 && (
            <div className="form-row">
              <label htmlFor="ctTemplate">Template</label>
              <select id="ctTemplate" value={newTemplateId} onChange={(e) => setNewTemplateId(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-row">
            <label htmlFor="ctLabel">Title</label>
            <input
              id="ctLabel"
              type="text"
              placeholder="e.g. the hospice or partner's name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <div className="form-buttons">
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleCreate} disabled={busy || !newLabel.trim()}>
              {busy ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!justCreated} onClose={() => setJustCreated(null)} title="Contract link ready">
        {justCreated && (
          <div className="form-card">
            <p className="form-hint">Share this link with the customer. They'll fill it in and sign.</p>
            <div className="url-field">
              <input type="text" readOnly value={shareUrl(justCreated.shareToken)} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn-secondary-sm" onClick={() => copyLink(justCreated.shareToken)}>
                Copy
              </button>
            </div>
            <div className="form-buttons">
              <button type="button" className="btn-primary" onClick={() => setJustCreated(null)}>
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={managingTemplates} onClose={() => setManagingTemplates(false)} title="Contract templates">
        <div className="items-list">
          {templates.map((t) => (
            <div className="items-row" key={t.id}>
              <div className="items-row-text">
                <span className="items-row-name">{t.title}</span>
                <span className="items-row-desc">{t.fields.length} fillable field{t.fields.length === 1 ? "" : "s"}</span>
              </div>
              <button type="button" className="icon-btn-sm" aria-label={`Edit ${t.title}`} onClick={() => openTemplateEditor(t)}>
                <Icon name="edit" />
              </button>
            </div>
          ))}
        </div>

        <div className="form-card" style={{ marginTop: 20 }}>
          <label>Contractor signature (Home &amp; Health Medical Supply)</label>
          <p className="form-hint">Drawn once, reused automatically on every contract's Contractor signature line.</p>
          {contractorSignature && (
            <img
              src={contractorSignature}
              alt="Current contractor signature"
              style={{ maxWidth: 240, background: "#fff", borderRadius: 8, padding: 8, marginBottom: 10 }}
            />
          )}
          <SignaturePad onChange={setDraftContractorSignature} />
          <div className="form-row">
            <label htmlFor="ctSigUpload">Or upload an image instead</label>
            <input
              id="ctSigUpload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setDraftContractorSignature(reader.result as string);
                reader.readAsDataURL(file);
                e.target.value = "";
              }}
            />
          </div>
          {draftContractorSignature && (
            <img
              src={draftContractorSignature}
              alt="New signature preview"
              style={{ maxWidth: 240, background: "#fff", borderRadius: 8, padding: 8, marginBottom: 10 }}
            />
          )}
          <div className="form-buttons">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveContractorSignature}
              disabled={savingContractorSignature || !draftContractorSignature}
            >
              {savingContractorSignature ? "Saving…" : contractorSignature ? "Replace signature" : "Save signature"}
            </button>
          </div>
        </div>

        <div className="form-buttons">
          <button type="button" className="btn-secondary" onClick={() => setManagingTemplates(false)}>
            Close
          </button>
        </div>
      </Modal>

      <Modal open={!!editingTemplateId} onClose={() => setEditingTemplateId(null)} title="Edit contract template">
        <div className="form-card">
          <p className="form-hint">
            Use <code>{"{{field_key}}"}</code> anywhere in the contract text to mark a blank -- it must match one of the
            field keys below exactly. Wrap text in <code>**double asterisks**</code> to bold it (e.g. section headers)
            or <code>*single asterisks*</code> to italicize it.
          </p>
          <div className="form-row">
            <label htmlFor="ctTitle">Title</label>
            <input id="ctTitle" type="text" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="ctBody">Contract text</label>
            <textarea id="ctBody" rows={14} value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Fillable fields</label>
            {templateFields.map((f, i) => (
              <div className="url-field" key={i} style={{ marginBottom: 6 }}>
                <input
                  type="text"
                  placeholder="key (matches {{this}})"
                  value={f.key}
                  onChange={(e) => updateField(i, { key: e.target.value.trim().replace(/\s+/g, "_") })}
                />
                <input
                  type="text"
                  placeholder="Label shown to recipient"
                  value={f.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                />
                <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as ContractField["type"] })}>
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                </select>
                <button type="button" className="icon-btn-sm icon-btn-danger" aria-label="Remove field" onClick={() => removeField(i)}>
                  <Icon name="trash" />
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary-sm" onClick={addField}>
              + Add field
            </button>
          </div>
          {templateBody && (
            <div className="form-row">
              <label>Preview</label>
              <div className="contract-body-preview">
                {fillTemplate(templateBody, {})
                  .split("\n\n")
                  .map((raw, i) => {
                    const { centered, twoColumn, indent, text } = parseParagraph(raw);
                    const renderInline = (t: string, kp: string) =>
                      splitRichText(t).map((seg, j) => {
                        const key = `${kp}-${j}`;
                        if (seg.type === "bold") return <strong key={key}>{seg.value}</strong>;
                        if (seg.type === "italic") return <em key={key}>{seg.value}</em>;
                        return seg.type === "text" ? seg.value : "";
                      });

                    if (twoColumn) {
                      return (
                        <div key={i} className="contract-two-col">
                          {text.split("\n").map((line, li) => {
                            const [left, right] = line.split("|").map((s) => s.trim());
                            return (
                              <div className="contract-two-col-row" key={li}>
                                <span className="contract-two-col-cell">{renderInline(left, `${i}-${li}-l`)}</span>
                                <span className="contract-two-col-cell">
                                  {right != null ? renderInline(right, `${i}-${li}-r`) : null}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    const style: CSSProperties =
                      indent > 0
                        ? {
                            marginLeft: `${indent * 18}px`,
                            ...(startsWithListMarker(text) ? { textIndent: "-1.1em", paddingLeft: "1.1em" } : {}),
                          }
                        : {};
                    return (
                      <p key={i} className={centered ? "contract-center" : undefined} style={style}>
                        {renderInline(text, `${i}`)}
                      </p>
                    );
                  })}
              </div>
            </div>
          )}
          <div className="form-buttons">
            <button type="button" className="btn-secondary" onClick={() => setEditingTemplateId(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSaveTemplate} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!fillingContract} onClose={() => setFillingContract(null)} title="Fill in details" wide>
        {fillingContract && (
          <div className="form-card">
            <p className="form-hint">
              Pre-fill the blanks so the recipient only needs to review and sign when they open the link.
            </p>
            <div className="contract-page contract-page--embedded">
              {renderContractPage(
                templateById.get(fillingContract.templateId)?.body ?? "",
                templateById.get(fillingContract.templateId)?.fields ?? [],
                fillValues,
                (key, value) => setFillValues((prev) => ({ ...prev, [key]: value })),
                undefined,
                false,
                contractorSignature,
              )}
            </div>
            <div className="form-buttons">
              <button type="button" className="btn-secondary" onClick={() => setFillingContract(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveFieldValues} disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <DetailModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? recipientLabel(viewing, templates) : "Contract"}
        fields={[
          { label: "Template", value: viewing ? templateById.get(viewing.templateId)?.title : undefined },
          { label: "Status", value: viewing?.status === "completed" ? "Completed" : "Pending" },
          { label: "Title", value: viewing?.internalLabel },
          ...(viewing
            ? (templateById.get(viewing.templateId)?.fields ?? []).map((f) => ({
                label: f.label,
                value: viewing.fieldValues[f.key]
                  ? f.type === "date"
                    ? formatDate(viewing.fieldValues[f.key])
                    : viewing.fieldValues[f.key]
                  : undefined,
              }))
            : []),
          { label: "Signed", value: viewing?.signedAt ? formatDate(viewing.signedAt.slice(0, 10)) : undefined },
          { label: "Created by", value: viewing?.createdBy },
          { label: "Link", value: viewing ? shareUrl(viewing.shareToken) : undefined },
          {
            label: "Signature",
            value: viewing?.signatureDataUrl ? (
              <img
                src={viewing.signatureDataUrl}
                alt="Signature"
                style={{ maxWidth: "100%", background: "#fff", borderRadius: 8 }}
              />
            ) : undefined,
          },
        ]}
      />
    </div>
  );
}
