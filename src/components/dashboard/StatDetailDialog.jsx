import React from 'react';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from "@/components/ui/dialog";
    import { ScrollArea } from "@/components/ui/scroll-area";

    const StatDetailDialog = ({ isOpen, onClose, title, data, total }) => {
      const isCommissionDialog = title === 'Comisiones Posibles';

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-lg border-white/10">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Aquí está el desglose de los datos.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-72 w-full rounded-md border border-white/10 p-4">
              {data && data.length > 0 ? (
                <ul className="space-y-4">
                  {data.map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="font-medium text-sm text-foreground">{item.primary}</span>
                      <span className="text-sm text-muted-foreground">{item.secondary}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No hay datos para mostrar.</p>
                </div>
              )}
            </ScrollArea>
            {isCommissionDialog && data && data.length > 0 && (
              <DialogFooter className="pt-4 border-t border-white/10">
                <div className="flex justify-between w-full">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-green-400">
                    ${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      );
    };

    export default StatDetailDialog;