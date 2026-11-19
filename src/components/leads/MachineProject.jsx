import React from 'react';
import { Package } from 'lucide-react';

export default function MachineProject({ machines, project }) {
  const names = (Array.isArray(machines) ? machines : [])
    .map(item => typeof item === 'string' ? item : item?.name)
    .filter(name => typeof name === 'string' && name.trim())
    .map(name => name.trim());
  const description = [...new Set(names)].join(' · ') || project?.trim() || 'Sin registrar';
  return (
    <div className="client-machine flex w-full min-w-0 items-start gap-1.5 text-left">
      <Package aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Máquina o proyecto</span>
        <span className="block whitespace-normal text-sm font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">{description}</span>
      </div>
    </div>
  );
}
