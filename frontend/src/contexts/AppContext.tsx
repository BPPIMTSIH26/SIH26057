import { createContext, useContext } from 'react';
import type { Anomaly, PortDefinition } from '../data/mockData';
import { getPort, PORTS, DEFAULT_PORT_ID } from '../data/mockData';

export interface PortContextType {
  selectedPortId: string;
  selectedPort: PortDefinition;
  setSelectedPortId: (portIdOrName: string) => void;
  ports: PortDefinition[];
  // Backwards compatibility with activeHarbour
  activeHarbour: string;
  setActiveHarbour: (portIdOrName: string) => void;
}

export const PortContext = createContext<PortContextType>({
  selectedPortId: DEFAULT_PORT_ID,
  selectedPort: PORTS[DEFAULT_PORT_ID],
  setSelectedPortId: () => {},
  ports: Object.values(PORTS),
  activeHarbour: PORTS[DEFAULT_PORT_ID].name,
  setActiveHarbour: () => {},
});

// Backwards-compatible alias
export const HarbourContext = PortContext;

export const RealTimeAnomalyContext = createContext<Record<string, Partial<Anomaly>>>({});

export const usePort = () => useContext(PortContext);
export const useHarbour = () => useContext(PortContext);
export const useRealTimeAnomalies = () => useContext(RealTimeAnomalyContext);
