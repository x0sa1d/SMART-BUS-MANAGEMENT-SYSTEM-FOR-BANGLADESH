"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { triggerSosAlert } from "@/actions/sos.actions";
import { toast } from "sonner";
import { Siren, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SosButtonProps = {
  tripId?: string;
  className?: string;
  floating?: boolean;
};

export function SosButton({ tripId, className, floating = false }: SosButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const send = () => {
    startTransition(async () => {
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          // optional
        }
      }

      const result = await triggerSosAlert({
        tripId,
        message: message.trim() || undefined,
        latitude,
        longitude,
      });

      if (result.success) {
        toast.success(result.data?.message || "SOS sent");
        setOpen(false);
        setMessage("");
      } else {
        toast.error(result.error || "Failed to send SOS");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className={cn(
          floating &&
            "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-soft-lg p-0",
          className
        )}
        onClick={() => setOpen(true)}
        title="Emergency help"
      >
        <Siren className={cn(floating ? "h-6 w-6" : "h-4 w-4")} />
        {!floating && <span>SOS help</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Siren className="h-5 w-5" /> Emergency help
            </DialogTitle>
            <DialogDescription>
              This notifies admins right away with your location. Use it only if you need urgent help.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>What happened? (optional)</Label>
              <Textarea
                placeholder="Medical issue, accident, or safety concern"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            <Button variant="destructive" className="w-full" disabled={pending} onClick={send}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
              Send SOS now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
