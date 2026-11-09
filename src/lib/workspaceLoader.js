// Publish the pipeline independently of slower secondary sections. Never replace
// a valid cache with empty arrays after a failed request.
export async function loadWorkspaceData({ db, userId, signal, onPipeline, onSection, onPipelineSettled, onError }) {
  const read = async table => {
    const source = table === 'leads' ? 'kyro_leads_summary' : table;
    const { data, error } = await db.from(source).select('*').eq('user_id', userId).abortSignal(signal);
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error(`Respuesta inválida: ${table}`);
    return data;
  };
  const pipeline = Promise.all([read('leads'), read('deals')])
    .then(([leads, deals]) => onPipeline(leads, deals))
    .catch(error => onError('pipeline', error))
    .finally(onPipelineSettled);
  const secondary = ['tasks', 'contacts', 'logistics', 'notes'].map(table => read(table)
    .then(data => onSection(table, data))
    .catch(error => onError(table, error)));
  await Promise.all([pipeline, ...secondary]);
}

export async function loadLeadDetails(db, userId, id) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const {data, error} = await db.from('leads').select('*').eq('id', id).eq('user_id', userId).abortSignal(controller.signal).single();
    if (error) throw error;
    if (!data) throw new Error('No se encontró el prospecto.');
    return data;
  } finally { clearTimeout(timeout); }
}

export function readArrayCache(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key));
    return Array.isArray(value) ? value : null;
  } catch { return null; }
}
