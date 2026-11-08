// Documentary imports belong to activity_status.clientDirectory, never the conversation.
export const isDocumentaryImport = entry => entry?.importBatch === 'kyro-clientes-2026-11-07'
  && typeof entry.text === 'string' && entry.text.startsWith('ACTUALIZACIÓN DOCUMENTAL ·');

export function conversationEntries(notes, legacyDate = null) {
  if (!notes) return [];
  let entries;
  try { entries = typeof notes === 'string' ? JSON.parse(notes) : notes; } catch { /* Legacy plain text. */ }
  if (!Array.isArray(entries)) return [{ text: notes, date: legacyDate, type: 'manual' }];
  return entries.filter(entry => !isDocumentaryImport(entry));
}

export function cleanConversationNotes(notes) {
  if (typeof notes !== 'string') return notes;
  try {
    const entries = JSON.parse(notes);
    if (Array.isArray(entries) && entries.some(isDocumentaryImport)) {
      return JSON.stringify(entries.filter(entry => !isDocumentaryImport(entry)));
    }
  } catch { /* Preserve legacy notes exactly. */ }
  return notes;
}
