import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LogisticsEditDialog = ({ isOpen, onClose, client, onSave }) => {
  const [formData, setFormData] = useState({
    supplier: '',
    equipmentCost: 0,
    maritimeCost: 0,
    customsCost: 0,
    landCost: 0,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        supplier: client.supplier || '',
        equipmentCost: client.equipmentCost || 0,
        maritimeCost: client.maritimeCost || 0,
        customsCost: client.customsCost || 0,
        landCost: client.landCost || 0,
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'supplier' ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(client.id, formData);
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Logística</DialogTitle>
          <DialogDescription>
            Actualiza los costos para {client.companyName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">
                Proveedor
              </Label>
              <Input
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipmentCost" className="text-right">
                Costo Equipo
              </Label>
              <Input
                id="equipmentCost"
                name="equipmentCost"
                type="number"
                value={formData.equipmentCost}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maritimeCost" className="text-right">
                Costo Marítimo
              </Label>
              <Input
                id="maritimeCost"
                name="maritimeCost"
                type="number"
                value={formData.maritimeCost}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customsCost" className="text-right">
                Aduanas
              </Label>
              <Input
                id="customsCost"
                name="customsCost"
                type="number"
                value={formData.customsCost}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="landCost" className="text-right">
                Terrestre
              </Label>
              <Input
                id="landCost"
                name="landCost"
                type="number"
                value={formData.landCost}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogisticsEditDialog;