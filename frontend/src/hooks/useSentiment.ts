import { useState, useEffect } from 'react';
import axios from 'axios';
import type { MarketSignal } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export function useSentiment() {
  const [signal, setSignal] = useState<MarketSignal | null>(null);
  const [history, setHistory] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrent = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<MarketSignal>('/sentiment/current');
      setSignal(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch current sentiment');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (days = 7) => {
    try {
      const { data } = await api.get<MarketSignal[]>(`/sentiment/history?days=${days}`);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const triggerScrape = async () => {
    try {
      setLoading(true);
      await api.post('/sentiment/scrape/trigger');
      await fetchCurrent();
      await fetchHistory();
    } catch (err) {
      setError('Scrape operation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrent();
    fetchHistory();
  }, []);

  return {
    signal,
    history,
    loading,
    error,
    fetchCurrent,
    fetchHistory,
    triggerScrape,
  };
}
