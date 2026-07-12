"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Trash2 } from "lucide-react";
import type { CartItem } from "./use-ticket-cart";

interface Props {
  items: CartItem[];
  total: number;
  count: number;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  checkoutDisabled?: boolean;
}

export function TicketCartPanel({ items, total, count, onRemove, onCheckout, checkoutDisabled }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <ShoppingCart className="h-4 w-4" />
          Cart
          {count > 0 && (
            <span className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center px-1">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Ticket Cart ({count})</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tickets in cart yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{item.routeLabel}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-muted-foreground">{item.companyName}</p>
                <p className="text-muted-foreground">
                  Seat {item.seatNumber} · Bus {item.busNumber} · {item.departureTime}
                </p>
                <p className="font-semibold text-primary">{formatCurrency(item.fare)}</p>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button variant="gradient" className="w-full" disabled={checkoutDisabled} onClick={onCheckout}>
              Checkout & Pay
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
