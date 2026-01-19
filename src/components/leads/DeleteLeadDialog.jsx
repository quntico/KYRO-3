import React, { useCallback } from 'react';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
    } from "@/components/ui/alert-dialog";
    import { buttonVariants } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';

    const DeleteLeadDialog = ({ isOpen, setIsOpen, lead, onDelete }) => {
      const handleConfirmDelete = useCallback(async () => {
        if (!lead) return;
        
        const { error } = await supabase.from('leads').delete().eq('id', lead.id);

        if (error) {
          toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
        } else {
          onDelete(lead.id);
          toast({ title: "Prospecto Eliminado", description: `"${lead.name}" ha sido eliminado.` });
        }
        setIsOpen(false);
      }, [lead, setIsOpen, onDelete]);

      return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar este prospecto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el prospecto
                "{lead?.name}" de tus registros.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    };

    export default React.memo(DeleteLeadDialog);