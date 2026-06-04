'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import TopBar from '@/components/TopBar';
import { getPredictions, labelPrediction, triggerTraining, getTrainStatus, getDatasetColumns, mergeDataset } from '@/lib/api';
import type { TrainJob } from '@/lib/types';
import { ArrowLeft, Upload, Play, Download, CheckCircle, AlertTriangle, Brain, RefreshCw, X } from 'lucide-react';

type Row = Record<string, unknown>;

export default function DatasetPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const gridRef  = useRef<AgGridReact>(null);
  const gridApi  = useRef<GridApi | null>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  const [rows, setRows]         = useState<Row[]>([]);
  const [colDefs, setColDefs]   = useState<ColDef[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Training job
  const [job, setJob]           = useState<TrainJob | null>(null);
  const [training, setTraining] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload / merge
  const [mergePreview, setMergePreview] = useState<{ rows: Row[]; filename: string } | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult]   = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);

  // ── Load rows ───────────────────────────────────────────────────────
  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPredictions({ limit: 5000 });
      const data = res.predictions as unknown as Row[];
      if (!data.length) { setRows([]); setColDefs([]); setLoading(false); return; }

      // Build col defs from first row — make true_danger_level editable
      const LEVEL_COLORS: Record<number, string> = { 1:'#639922', 2:'#5DCAA5', 3:'#BA7517', 4:'#D85A30', 5:'#E24B4A' };
      const cols: ColDef[] = Object.keys(data[0]).map((key): ColDef => {
        const base: ColDef = { field: key, headerName: key, filter: true, sortable: true, resizable: true, minWidth: 100 };
        if (key === 'true_danger_level') {
          const col: ColDef = {
            ...base,
            editable: true,
            cellStyle: (params: { value: unknown }) => {
              const v = params.value as number;
              return { color: v ? (LEVEL_COLORS[v] ?? 'inherit') : 'var(--text-muted)', fontWeight: v ? 500 : 400 };
            },
          };
          return col;
        }
        if (key === 'validated') {
          const col: ColDef = { ...base, cellRenderer: (p: { value: unknown }) => p.value ? '✓' : '—' };
          return col;
        }
        return base;
      });

      setColDefs(cols);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRows(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, [loadRows]);

  // ── Inline label edit ────────────────────────────────────────────────
  const onCellEdit = useCallback(async (event: { data: Row; colDef: ColDef; newValue: unknown }) => {
    if (event.colDef.field !== 'true_danger_level') return;
    const val = parseInt(String(event.newValue));
    if (!val || val < 1 || val > 5) return;
    try {
      await labelPrediction(event.data.id as number, val);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save label');
    }
  }, []);

  // ── Push to training ─────────────────────────────────────────────────
  const handleTrain = async () => {
    setTraining(true);
    setError(null);
    try {
      const res = await triggerTraining();
      setJob({ job_id: res.job_id, status: 'running' });
      pollRef.current = setInterval(async () => {
        try {
          const j = await getTrainStatus(res.job_id);
          setJob(j);
          if (j.status !== 'running') {
            if (pollRef.current) clearInterval(pollRef.current);
            setTraining(false);
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          setTraining(false);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start training');
      setTraining(false);
    }
  };

  // ── CSV export ───────────────────────────────────────────────────────
  const handleExport = () => {
    gridApi.current?.exportDataAsCsv({ fileName: `dataset_${Date.now()}.csv` });
  };

  // ── CSV upload / merge ───────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMergeResult(null);

    try {
      // Get live schema columns
      const { columns: liveColumns } = await getDatasetColumns();

      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) { setError('CSV is empty'); return; }

      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const AUTO_COLS  = new Set(['id', 'validated', 'timestamp', 'event_id']);
      const liveInsertable = liveColumns.filter(c => !AUTO_COLS.has(c));
      const csvInsertable  = csvHeaders.filter(c => !AUTO_COLS.has(c));

      // Validate columns match
      const missing = liveInsertable.filter(c => !csvInsertable.includes(c));
      const extra   = csvInsertable.filter(c => !liveInsertable.includes(c));
      if (missing.length || extra.length) {
        const parts = [];
        if (missing.length) parts.push(`Missing columns: ${missing.join(', ')}`);
        if (extra.length)   parts.push(`Unexpected columns: ${extra.join(', ')}`);
        setError(`Column mismatch — fix your CSV before merging.\n${parts.join('\n')}`);
        if (fileRef.current) fileRef.current.value = '';
        return;
      }

      // Parse rows
      const parsed: Row[] = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: Row = {};
        csvHeaders.forEach((h, i) => { obj[h] = vals[i] ?? null; });
        return obj;
      });

      setMergePreview({ rows: parsed, filename: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const confirmMerge = async () => {
    if (!mergePreview) return;
    setMergeLoading(true);
    setError(null);
    try {
      const res = await mergeDataset(mergePreview.rows);
      setMergeResult({ inserted: res.inserted, skipped: res.skipped, errors: res.errors });
      setMergePreview(null);
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setMergeLoading(false);
    }
  };

  const onGridReady = (e: GridReadyEvent) => { gridApi.current = e.api; };

  const labeledCount = rows.filter(r => r.validated).length;
  const canTrain     = labeledCount >= 20 && !training;

  return (
    <div>
      <TopBar title="Dataset review" subtitle={`${rows.length} rows · ${labeledCount} labeled`}>
        <button onClick={() => router.push(`/project/${id}/training`)} className="btn btn-ghost">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={loadRows} className="btn btn-ghost">
          <RefreshCw size={14} /> Refresh
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn btn-ghost">
          <Upload size={14} /> Merge CSV
        </button>
        <button onClick={handleExport} className="btn btn-ghost">
          <Download size={14} /> Export CSV
        </button>
        <button onClick={handleTrain} disabled={!canTrain} className="btn btn-primary" style={{ opacity: canTrain ? 1 : 0.5 }}>
          <Play size={14} /> {training ? 'Training...' : 'Push to training'}
        </button>
      </TopBar>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Error */}
      {error && (
        <div className="card p-4 mb-4 text-sm whitespace-pre-line" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Training job banner */}
      {job && (
        <div className="card p-4 mb-4 flex items-center gap-3 animate-in" style={{
          borderColor: job.status === 'done' ? '#639922' : job.status === 'failed' ? 'var(--danger)' : 'var(--accent)',
        }}>
          {job.status === 'running'
            ? <Brain size={16} className="pulse-soft" style={{ color: 'var(--accent)' }} />
            : job.status === 'done'
            ? <CheckCircle size={16} style={{ color: '#639922' }} />
            : <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {job.status === 'running' ? 'Training in progress...' : job.status === 'done' ? 'Training complete' : 'Training failed'}
            </div>
            {job.status === 'done' && job.result && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                accuracy={(job.result as any)?.metrics?.accuracy?.toFixed(3)} · f1={(job.result as any)?.metrics?.f1_macro?.toFixed(3)} · rows={(job.result as any)?.rows_used}
              </div>
            )}
            {job.status === 'failed' && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>{job.error}</div>
            )}
          </div>
        </div>
      )}

      {/* Merge result banner */}
      {mergeResult && (
        <div className="card p-4 mb-4 flex items-center justify-between gap-3 animate-in" style={{ borderColor: '#639922' }}>
          <div className="flex items-center gap-3">
            <CheckCircle size={16} style={{ color: '#639922' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Merged — {mergeResult.inserted} rows inserted{mergeResult.skipped > 0 ? `, ${mergeResult.skipped} skipped` : ''}
            </span>
          </div>
          <button onClick={() => setMergeResult(null)} className="btn btn-ghost" style={{ padding: '2px 6px' }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Merge preview modal */}
      {mergePreview && (
        <div className="card p-5 mb-4 animate-in" style={{ borderColor: 'var(--accent)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Merge "{mergePreview.filename}"
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {mergePreview.rows.length} rows · columns match ✓ · preview of first 3 rows below
              </div>
            </div>
            <button onClick={() => setMergePreview(null)} className="btn btn-ghost" style={{ padding: '2px 6px' }}>
              <X size={13} />
            </button>
          </div>
          {/* Mini preview table */}
          <div style={{ overflowX: 'auto', marginBottom: 16, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  {Object.keys(mergePreview.rows[0]).map(k => (
                    <th key={k} style={{ padding: '3px 10px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mergePreview.rows.slice(0, 3).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} style={{ padding: '3px 10px' }}>{String(v ?? '—').slice(0, 30)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={confirmMerge} disabled={mergeLoading} className="btn btn-primary" style={{ opacity: mergeLoading ? 0.6 : 1 }}>
              {mergeLoading ? 'Merging...' : `Confirm merge (${mergePreview.rows.length} rows)`}
            </button>
            <button onClick={() => setMergePreview(null)} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* AG Grid */}
      {loading ? (
        <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading dataset...</div>
      ) : rows.length === 0 ? (
        <div className="card p-12 text-center">
          <Brain size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No rows yet. Record a session on the training page first.</p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-in" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={rows}
              columnDefs={colDefs}
              onGridReady={onGridReady}
              onCellValueChanged={onCellEdit}
              defaultColDef={{ filter: true, sortable: true, resizable: true }}
              pagination
              paginationPageSize={100}
              suppressMovableColumns={false}
              enableCellTextSelection
            />
          </div>
        </div>
      )}
    </div>
  );
}