import { useState } from "react";
import { BottomNavLayout } from "@/components/layout";
import { useMachinesList, useMachineCreate, useMachineUpdate, useMachineDelete, useSettings } from "@/hooks/use-gymflow";
import { useTranslation } from "@/lib/i18n";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Machine } from "@workspace/api-client-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function Machines() {
  const { data: settings } = useSettings();
  const t = useTranslation(settings?.language);
  const { data: machines = [], isLoading } = useMachinesList();
  
  const createMachine = useMachineCreate();
  const updateMachine = useMachineUpdate();
  const deleteMachine = useMachineDelete();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", imageUrl: "" }
  });

  const openNew = () => {
    setEditingMachine(null);
    form.reset({ name: "", imageUrl: "" });
    setIsModalOpen(true);
  };

  const openEdit = (machine: Machine) => {
    setEditingMachine(machine);
    form.reset({
      name: machine.name,
      imageUrl: machine.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    // Convert empty string back to null/undefined for the API
    const payload = { ...data, imageUrl: data.imageUrl || null };
    if (editingMachine) {
      updateMachine.mutate(
        { id: editingMachine.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createMachine.mutate(
        { data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this machine?")) {
      deleteMachine.mutate({ id });
      setIsModalOpen(false);
    }
  };

  return (
    <BottomNavLayout>
      <div className="p-6 pt-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">{t("machines")}</h1>
          <Button onClick={openNew} size="icon" className="rounded-full h-12 w-12 shadow-lg shadow-primary/20">
            <Plus />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : machines.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-2xl border-border bg-card/50">
            <p className="text-muted-foreground">{t("noMachines")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {machines.map((machine, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={machine.id}
                onClick={() => openEdit(machine)}
                className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors flex flex-col"
              >
                <div className="h-32 bg-secondary relative">
                  {machine.imageUrl ? (
                    <img src={machine.imageUrl} alt={machine.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={32} opacity={0.2} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Edit2 className="text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{machine.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md w-[90vw] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingMachine ? t("edit") : t("addMachine")}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>{t("machineName")}</Label>
              <Input {...form.register("name")} placeholder="e.g. Leg Press" className="h-12 bg-background" />
              {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>{t("imageUrl")} (Optional)</Label>
              <Input {...form.register("imageUrl")} placeholder="https://..." className="h-12 bg-background" />
              {form.formState.errors.imageUrl && <p className="text-destructive text-sm">{form.formState.errors.imageUrl.message}</p>}
            </div>

            <DialogFooter className="flex-row sm:justify-between gap-2 pt-4">
              {editingMachine ? (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => handleDelete(editingMachine.id)}
                  disabled={deleteMachine.isPending}
                  className="flex-1 h-12"
                >
                  <Trash2 size={18} className="mr-2" /> {t("delete")}
                </Button>
              ) : (
                <div className="flex-1"></div>
              )}
              <Button 
                type="submit" 
                className="flex-1 h-12"
                disabled={createMachine.isPending || updateMachine.isPending}
              >
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </BottomNavLayout>
  );
}
