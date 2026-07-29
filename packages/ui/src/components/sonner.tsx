"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      // theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      className="toaster group"
      gap={10}
      style={
        {
          "--normal-bg": "var(--nc-surface, #fff)",
          "--normal-text": "var(--nc-text-primary, #050505)",
          "--normal-border": "var(--nc-border-hair, rgba(0,0,0,0.06))",
          "--success-bg": "var(--nc-surface, #fff)",
          "--success-text": "var(--nc-text-primary, #050505)",
          "--success-border": "var(--nc-green-dark, #008F5A)",
          "--error-bg": "var(--nc-surface, #fff)",
          "--error-text": "var(--nc-text-primary, #050505)",
          "--error-border": "var(--nc-danger, #C0392B)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 7000,
        // classNames: {
        //   toast:
        //     "font-sans shadow-[0_10px_30px_rgba(19,19,19,0.1)] !border-l-[3px] px-4 py-3.5",
        //   title: "text-[14.5px] font-semibold leading-tight",
        //   description: "!text-[13.5px] !text-[color:var(--nc-text-secondary,#4B4B4B)] leading-snug mt-0.5",
        //   actionButton:
        //     "!rounded-full !bg-[var(--nc-ink,#131313)] !text-[var(--nc-cream,#F9F9EF)] !text-[12.5px] !font-semibold hover:!opacity-90",
        //   cancelButton:
        //     "!rounded-full !border !border-[var(--nc-border-strong,rgba(0,0,0,0.14))] !bg-transparent !text-[12.5px] !font-semibold",
        //   closeButton: "!border-[var(--nc-border-hair,rgba(0,0,0,0.06))]",
        // },
        classNames: {
          toast: "font-sans shadow-[0_10px_30px_rgba(19,19,19,0.1)] !border-l-[3px] px-4 py-3.5",
          title: "text-[14.5px] font-semibold leading-tight",
          description: "!text-[13px] !text-[color:var(--text-secondary,#4B4B4B)] leading-snug mt-0.5",
          actionButton: "!rounded-full !bg-[var(--ink,#131313)] !text-[var(--cream,#F9F9EF)] !text-[12.5px] !font-semibold hover:!opacity-90",
          cancelButton: "!rounded-full !border !border-[var(--border-strong,rgba(0,0,0,0.14))] !bg-transparent !text-[12.5px] !font-semibold",
        },
      }}
      icons={{
        success: <CheckCircle2 size={18} strokeWidth={2} style={{ color: "var(--nc-green-dark, #008F5A)" }} />,
        error: <XCircle size={18} strokeWidth={2} style={{ color: "var(--nc-danger, #C0392B)" }} />,
        warning: <AlertTriangle size={18} strokeWidth={2} style={{ color: "#B8860B" }} />,
        info: <Info size={18} strokeWidth={2} style={{ color: "var(--nc-ink, #131313)" }} />,
        loading: <Loader2 size={18} strokeWidth={2} className="animate-spin" style={{ color: "var(--nc-ink, #131313)" }} />,
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from 'sonner'