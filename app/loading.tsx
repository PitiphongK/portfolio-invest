import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return(
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
         <LoaderCircle className="size-20 animate-spin"/>
        </div>
      </div>
    </div>
  );
};