import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div">;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardShadow({ className, ...props }: CardProps) {
  return <div className={cn("card-shadow", className)} {...props} />;
}

export function CardBorder({ className, ...props }: CardProps) {
  return <div className={cn("card-border", className)} {...props} />;
}
