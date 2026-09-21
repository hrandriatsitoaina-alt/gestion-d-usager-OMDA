// src/hooks/useT.js
import { useCallback } from 'react';
import { useParametres } from '../context/ParametreContext';

/**
 * ✅ Hook de traduction robuste
 * - Lit la langue UNIQUEMENT depuis le Context (source unique)
 * - Retourne `t(fr, mg, en)` et `langue`
 * - Re-render automatique quand la langue change
 */
export const useT = () => {
  const { parametres } = useParametres();
  const langue = parametres?.langue || 'fr';

  const t = useCallback(
    (fr, mg, en) => {
      switch (langue) {
        case 'mg':
          return mg || fr;
        case 'en':
          return en || fr;
        default:
          return fr;
      }
    },
    [langue]
  );

  return { t, langue };
};

export default useT;