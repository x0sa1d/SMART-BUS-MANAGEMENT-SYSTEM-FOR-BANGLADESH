"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";

type QrScannerProps = {
  onScan: (value: string) => void;
  active: boolean;
  onActiveChange: (active: boolean) => void;
};

export function QrScanner({ onScan, active, onActiveChange }: QrScannerProps) {
  const regionId = "admin-ticket-qr-reader";
  const scannerRef = useRef<{
    stop: () => Promise<unknown>;
    clear: () => void | Promise<unknown>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(false);
  const lastScan = useRef("");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;

    async function stopScanner() {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        // already stopped
      }
    }

    async function startScanner() {
      setBooting(true);
      setError(null);
      await stopScanner();
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            if (!decoded || decoded === lastScan.current) return;
            lastScan.current = decoded;
            onScanRef.current(decoded);
          },
          () => undefined
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not start camera";
        if (!cancelled) {
          setError(message);
          onActiveChange(false);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    if (active) {
      void startScanner();
    } else {
      void stopScanner();
    }

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [active, onActiveChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={active ? "secondary" : "outline"}
          onClick={() => onActiveChange(!active)}
          disabled={booting}
        >
          {booting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : active ? (
            <CameraOff className="h-4 w-4" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {active ? "Stop Camera" : "Scan QR with Camera"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div
        id={regionId}
        className={active ? "overflow-hidden rounded-xl border border-border bg-black/90 min-h-[280px]" : "hidden"}
      />
      {active && (
        <p className="text-xs text-muted-foreground">
          Point the camera at the ticket QR code. Lookup runs automatically when a code is detected.
        </p>
      )}
    </div>
  );
}
