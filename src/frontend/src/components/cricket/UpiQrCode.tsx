import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UpiQrCodeProps {
  upiId: string;
  amount: bigint;
  name?: string;
}

export default function UpiQrCode({ upiId, amount, name }: UpiQrCodeProps) {
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amount.toString()}&cu=INR&tn=${encodeURIComponent("Cricket+Entry+Fee")}${name ? `&pn=${encodeURIComponent(name)}` : ""}`;

  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use a QR service URL for generating QR image
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  async function copyUpiId() {
    // Prevent double-firing while already in "copied" state
    if (copied) return;
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast.success("UPI ID copied!", { duration: 1500 });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please copy manually");
    }
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Fallback: draw a grid pattern on canvas if image fails
  useEffect(() => {
    if (imgError && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const size = 200;
      canvasRef.current.width = size;
      canvasRef.current.height = size;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = "#1a4731";
      const modules = 25;
      const moduleSize = size / modules;
      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          const hash =
            (row * 31 + col * 17 + upiId.charCodeAt(row % upiId.length)) % 3;
          if (hash === 0) {
            ctx.fillRect(
              col * moduleSize,
              row * moduleSize,
              moduleSize - 1,
              moduleSize - 1,
            );
          }
        }
      }

      const corners = [
        [0, 0],
        [size - 7 * moduleSize, 0],
        [0, size - 7 * moduleSize],
      ];
      for (const [x, y] of corners) {
        ctx.fillStyle = "#1a4731";
        ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          x + moduleSize,
          y + moduleSize,
          5 * moduleSize,
          5 * moduleSize,
        );
        ctx.fillStyle = "#1a4731";
        ctx.fillRect(
          x + 2 * moduleSize,
          y + 2 * moduleSize,
          3 * moduleSize,
          3 * moduleSize,
        );
      }
    }
  }, [imgError, upiId]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code Box */}
      <div className="relative bg-white p-3 rounded-2xl shadow-card border-2 border-primary/10">
        <div className="bg-primary/5 rounded-xl p-3">
          {!imgError ? (
            <img
              src={qrApiUrl}
              alt={`QR Code for UPI payment to ${upiId}`}
              className="w-44 h-44 block"
              onError={() => setImgError(true)}
            />
          ) : (
            <canvas
              ref={canvasRef}
              className="w-44 h-44 block"
              style={{ imageRendering: "pixelated" }}
            />
          )}
        </div>
        {/* UPI badge */}
        <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-[8px] font-display font-black px-1.5 py-0.5 rounded-md tracking-wider">
          UPI
        </div>
      </div>

      {/* UPI Details */}
      <div className="w-full space-y-2">
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-0.5 font-body">
            Pay to UPI ID
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold text-foreground text-sm truncate">
              {upiId}
            </p>
            {/* Enhanced copy button with animated icon swap */}
            <Button
              type="button"
              variant={copied ? "default" : "ghost"}
              size="icon"
              className={`h-8 w-8 shrink-0 transition-all duration-200 ${
                copied
                  ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                  : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
              }`}
              onClick={copyUpiId}
              aria-label={copied ? "Copied!" : "Copy UPI ID"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{
                      duration: 0.18,
                      type: "spring",
                      stiffness: 400,
                    }}
                  >
                    <Check size={14} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    <Copy size={14} />
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
          {/* "Copied!" label below */}
          <AnimatePresence>
            {copied && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] text-primary font-semibold mt-1 overflow-hidden"
              >
                ✓ Copied to clipboard!
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-body">Entry Fee</p>
            <p className="font-display font-black text-xl text-primary">
              ₹{amount.toString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-body">Currency</p>
            <p className="font-display font-bold text-foreground">INR</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground px-4 font-body">
        Scan with any UPI app (Google Pay, PhonePe, Paytm) and save the
        transaction ID for registration.
      </p>
    </div>
  );
}
