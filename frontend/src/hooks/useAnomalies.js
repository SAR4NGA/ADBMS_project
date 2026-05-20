import { useState, useEffect } from 'react';
import { getAnomalies } from '../services/analyticsService';

export function useAnomalies(year, month) {
  const [data, setData]       = useState({ year, month, anomalies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAnomalies(year, month)
      .then(setData)
      .catch(err => setError(err?.message || 'Failed to load anomaly data'))
      .finally(() => setLoading(false));
  }, [year, month]);

  // Derived summary KPIs
  const spikes   = data.anomalies.filter(a => a.VariancePct > 15);
  const savings  = data.anomalies.filter(a => a.VariancePct < -15);
  const normal   = data.anomalies.filter(a => Math.abs(a.VariancePct) <= 15);

  return {
    anomalies: data.anomalies,
    year:      data.year,
    month:     data.month,
    loading,
    error,
    summary: { spikes: spikes.length, savings: savings.length, normal: normal.length },
  };
}
