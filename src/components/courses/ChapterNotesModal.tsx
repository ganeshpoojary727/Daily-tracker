import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { CourseChapter } from '../../types';
import { FileText, Save, Check } from 'lucide-react';

interface ChapterNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: CourseChapter;
  onSaveNotes: (notes: string) => void;
}

export const ChapterNotesModal: React.FC<ChapterNotesModalProps> = ({
  isOpen,
  onClose,
  chapter,
  onSaveNotes,
}) => {
  const [notes, setNotes] = useState(chapter.notes || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveNotes(notes);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chapter Notes">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-wider text-text-muted-dark">Lesson</p>
          <h4 className="text-sm font-semibold text-text-primary-dark">{chapter.title}</h4>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted-dark flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Key Takeaways, Code Snippets or Questions</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Remember to check for null pointers in linked node traversal. Spring annotations: @RestController, @Service..."
            rows={6}
            className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 text-xs text-text-primary-dark placeholder-text-muted-dark/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-border-dark">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-surface-border-dark px-3 py-1.5 text-xs font-medium text-text-muted-dark hover:bg-surface-dark hover:text-text-primary-dark"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-streak px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-streak-hover"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
