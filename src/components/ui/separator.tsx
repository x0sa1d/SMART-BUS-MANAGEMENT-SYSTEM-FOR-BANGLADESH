import { Separator } from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

function SeparatorComponent({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  );
}

export { SeparatorComponent as Separator };
