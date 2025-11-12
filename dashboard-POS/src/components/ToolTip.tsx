import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipPrimitive.Root delayDuration={0}>
      {" "}
      {/* Aparece inmediatamente */}
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
        sideOffset={5}
      >
        {content}
        <TooltipPrimitive.Arrow className="fill-black" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  );
}
