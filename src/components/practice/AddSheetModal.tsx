import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { importSheet } from '../../lib/problemUtils';
import { PracticeSheet } from '../../types';

interface AddSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSheet: (sheet: PracticeSheet) => void;
}

export const AddSheetModal: React.FC<AddSheetModalProps> = ({ isOpen, onClose, onAddSheet }) => {
  const categories = useTaskStore((state) => state.categories);
  const addCategory = useTaskStore((state) => state.addCategory);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'leetcode');
  
  // New category inline creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatTarget, setNewCatTarget] = useState(5);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);

      try {
        const parsed = JSON.parse(content);
        const autoTitle = parsed.meta?.title || parsed.title || file.name.replace(/\.json$/i, '');
        if (autoTitle) {
          setTitle(autoTitle);
        }
      } catch {
        setErrorMsg('Invalid JSON format. Please ensure the uploaded file contains valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CREATE_NEW') {
      setIsCreatingCategory(true);
    } else {
      setIsCreatingCategory(false);
      setSelectedCategoryId(val);
    }
  };

  const handleCreateInlineCategory = () => {
    if (!newCatName.trim()) return;
    const catId = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addCategory({
      name: newCatName.trim(),
      color: '#A0AEC0',
      icon: 'BookOpen',
      dailyTarget: newCatTarget,
      unit: 'questions',
    });
    setSelectedCategoryId(catId);
    setIsCreatingCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fileContent) {
      setErrorMsg('Please select a JSON file to upload.');
      return;
    }

    let targetCatId = selectedCategoryId;
    if (isCreatingCategory) {
      if (!newCatName.trim()) {
        setErrorMsg('Please enter a name for the new daily category.');
        return;
      }
      targetCatId = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      handleCreateInlineCategory();
    }

    try {
      const importedSheet = importSheet(fileContent, targetCatId, title);
      onAddSheet(importedSheet);
      // Reset state and close
      setFileContent('');
      setFileName('');
      setTitle('');
      setErrorMsg(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to import sheet file.');
    }
  };

  const exampleJsonFormat = `{
  "meta": {
    "title": "TCS Technical Questions",
    "source": "My own collection"
  },
  "categories": [
    {
      "id": "dbms",
      "name": "DBMS",
      "patterns": [
        {
          "id": "normalization",
          "name": "Normalization",
          "problems": [
            { "id": "dbms-norm-1", "title": "Explain 1NF, 2NF, 3NF with an example" },
            { "id": "dbms-norm-2", "title": "What problems does normalization solve?", "notes": "Focus on redundancy" }
          ]
        }
      ]
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-surface-border-dark bg-surface-dark p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border-dark pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-streak" />
            <h3 className="font-display font-bold text-lg text-text-primary-dark">
              Upload New Practice Sheet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted-dark hover:bg-surface-hover-dark hover:text-text-primary-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFormatGuide(!showFormatGuide)}
              className="text-[11px] underline font-mono text-rose-300 hover:text-rose-200"
            >
              {showFormatGuide ? 'Hide format guide' : 'Show expected JSON format guide'}
            </button>
          </div>
        )}

        {/* Optional JSON Format Guide Drawer */}
        {showFormatGuide && (
          <div className="rounded-xl border border-surface-border-dark bg-bg-dark p-3 text-xs font-mono space-y-2">
            <p className="text-text-muted-dark font-bold">Expected JSON Structure:</p>
            <pre className="bg-surface-dark p-3 rounded-lg overflow-x-auto text-[11px] text-emerald-400">
              {exampleJsonFormat}
            </pre>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1.5 font-bold">
              Select JSON File (.json)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-border-dark bg-surface-hover-dark/40 p-6 text-center hover:border-streak hover:bg-surface-hover-dark transition-all cursor-pointer"
            >
              <FileText className="w-8 h-8 text-streak mb-2" />
              <p className="text-xs font-semibold text-text-primary-dark">
                {fileName ? fileName : 'Click to select or drop a JSON file here'}
              </p>
              <p className="text-[11px] font-mono text-text-muted-dark mt-1">
                Supports category → pattern → problem hierarchy
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Sheet Title */}
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1 font-bold">
              Sheet Name / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TCS Technical Questions"
              className="w-full rounded-xl border border-surface-border-dark bg-surface-hover-dark px-3.5 py-2.5 text-xs font-sans text-text-primary-dark focus:border-streak focus:outline-none"
              required
            />
          </div>

          {/* Linked Daily Category Selection */}
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1 font-bold">
              Count solves toward Daily Category
            </label>
            <select
              value={isCreatingCategory ? 'CREATE_NEW' : selectedCategoryId}
              onChange={handleCategorySelectChange}
              className="w-full rounded-xl border border-surface-border-dark bg-surface-hover-dark px-3.5 py-2.5 text-xs font-sans text-text-primary-dark focus:border-streak focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.dailyTarget ? `${cat.dailyTarget} ${cat.unit || 'target'}/day` : 'No target'})
                </option>
              ))}
              <option value="CREATE_NEW">+ Create new category…</option>
            </select>
          </div>

          {/* Inline Create Category Box */}
          {isCreatingCategory && (
            <div className="rounded-xl border border-streak/40 bg-streak/5 p-3.5 space-y-3">
              <p className="text-xs font-bold font-display text-streak flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create New Daily Category
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-text-muted-dark mb-1">Category Name</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Technical Aptitude"
                    className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-1.5 text-xs text-text-primary-dark focus:border-streak focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-text-muted-dark mb-1">Daily Target</label>
                  <input
                    type="number"
                    min="1"
                    value={newCatTarget}
                    onChange={(e) => setNewCatTarget(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-1.5 text-xs text-text-primary-dark focus:border-streak focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border-dark">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-surface-border-dark px-4 py-2 text-xs font-semibold text-text-muted-dark hover:bg-surface-hover-dark hover:text-text-primary-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileContent}
              className="flex items-center gap-2 rounded-xl bg-streak px-5 py-2 text-xs font-bold text-white shadow-lg shadow-streak/30 hover:bg-streak/90 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import Sheet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
