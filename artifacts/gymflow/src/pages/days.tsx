import { useState } from "react";
import { BottomNavLayout } from "@/components/layout";
import { useDaysList, useDayCreate, useDayUpdate, useDayDelete, useSettings } from "@/hooks/use-gymflow";
import { useTranslation } from "@/lib/i18n";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Day } from "@workspace/api-client-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  dayName: z.string().min(1, "Name is required"),
  workoutType: z.string().optional(),
  workoutIcon: z.string().optional(),
  orderIndex: z.coerce.number().int(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Days() {
  const { data: settings } = useSettings();
  const t = useTranslation(settings?.language);
  const { data: days = [], isLoading } = useDaysList();
  
  const createDay = useDayCreate();
  const updateDay = useDayUpdate();
  const deleteDay = useDayDelete();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Day | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { dayName: "", workoutType: "", workoutIcon: "", orderIndex: 0 }
  });

  const openNew = () => {
    setEditingDay(null);
    form.reset({ dayName: "", workoutType: "", workoutIcon: "", orderIndex: days.length });
    setIsModalOpen(true);
  };

  const openEdit = (day: Day) => {
    setEditingDay(day);
    form.reset({
      dayName: day.dayName,
      workoutType: day.workoutType || "",
      workoutIcon: day.workoutIcon || "",
      orderIndex: day.orderIndex,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    if (editingDay) {
      updateDay.mutate(
        { id: editingDay.id, data },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createDay.mutate(
        { data },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteDay.mutate({ id });
      setIsModalOpen(false);
    }
  };

  const sortedDays = [...days].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <BottomNavLayout>
      <div className="p-6 pt-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">{t("days")}</h1>
          <Button onClick={openNew} size="icon" className="rounded-full h-12 w-12 shadow-lg shadow-primary/20">
            <Plus />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : sortedDays.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-2xl border-border bg-card/50">
            <p className="text-muted-foreground">{t("noDays")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDays.map((day, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={day.id}
                className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => openEdit(day)}
              >
                <div className="text-muted-foreground opacity-50 cursor-grab">
                  <GripVertical size={20} />
                </div>
                
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shadow-inner">
                  {day.workoutIcon || "💪"}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{day.dayName}</h3>
                  <p className="text-sm text-primary/80 font-medium">{day.workoutType || "Rest"}</p>
                </div>

                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white">
                  <Edit2 size={18} />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md w-[90vw] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingDay ? t("edit") : t("addDay")}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>{t("dayName")}</Label>
              <Input {...form.register("dayName")} placeholder="e.g. Monday" className="h-12 bg-background" />
              {form.formState.errors.dayName && <p className="text-destructive text-sm">{form.formState.errors.dayName.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>{t("workoutType")}</Label>
              <Input {...form.register("workoutType")} placeholder="e.g. Push, Legs, Rest" className="h-12 bg-background" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("icon")}</Label>
                <Input {...form.register("workoutIcon")} placeholder="🏋️‍♂️" className="h-12 bg-background text-2xl text-center" />
              </div>
              <div className="space-y-2">
                <Label>{t("order")}</Label>
                <Input type="number" {...form.register("orderIndex")} className="h-12 bg-background" />
              </div>
            </div>

            <DialogFooter className="flex-row sm:justify-between gap-2 pt-4">
              {editingDay ? (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => handleDelete(editingDay.id)}
                  disabled={deleteDay.isPending}
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
                disabled={createDay.isPending || updateDay.isPending}
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
