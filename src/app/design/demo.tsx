"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { KeywordChips } from "@/components/mc/keyword-chips"
import { MessageEditor } from "@/components/mc/message-editor"
import { OptionGroup } from "@/components/mc/option-group"
import { PhonePreview } from "@/components/mc/phone-preview"
import { Composer } from "@/components/mc/inbox"
import type { Message } from "@/lib/message"

/** El asistente "comentario → DM" en miniatura: el editor y la vista previa comparten estado. */
export function WizardDemo() {
  const [scope, setScope] = useState("specific")
  const [match, setMatch] = useState("words")
  const [include, setInclude] = useState(["link", "info"])
  const [exclude, setExclude] = useState(["precio"])
  const [opening, setOpening] = useState<Message>({
    text: "¡Hola! Gracias por comentar 🙌 ¿Te paso el link?",
    privateReply: true,
    buttons: [{ id: "b1", type: "postback", title: "Sí, pasámelo" }],
    quickReplies: [],
  })
  const [link, setLink] = useState<Message>({
    text: "Aquí lo tienes 👇",
    privateReply: false,
    buttons: [{ id: "b2", type: "url", title: "Abrir link", url: "https://", track: true }],
    quickReplies: [],
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[var(--tk-layout-wizard-panel)_1fr]">
      <div className="grid content-start gap-6">
        <section className="grid gap-3">
          <h3 className="text-lg">Cuando alguien comenta en</h3>
          <OptionGroup
            label="Cuando alguien comenta en"
            value={scope}
            onValueChange={setScope}
            options={[
              { value: "specific", label: "Un post o reel puntual" },
              { value: "any", label: "Cualquier post o reel" },
              { value: "next", label: "El próximo que publique", hint: "Solo puede haber uno esperando a la vez." },
            ]}
          />
        </section>
        <section className="grid gap-3">
          <h3 className="text-lg">Y el comentario tiene</h3>
          <OptionGroup
            label="Y el comentario tiene"
            value={match}
            onValueChange={setMatch}
            options={[
              { value: "words", label: "Alguna de estas palabras" },
              { value: "any", label: "Cualquier cosa" },
            ]}
          />
          {match === "words" && (
            <>
              <KeywordChips label="Palabras que lo activan" value={include} onChange={setInclude} />
              <KeywordChips label="Palabras que lo frenan" value={exclude} onChange={setExclude} variant="exclude" />
            </>
          )}
        </section>
        <MessageEditor label="Primer DM" value={opening} onChange={setOpening} isFirst />
        <MessageEditor label="DM con el link" value={link} onChange={setLink} />
      </div>
      <div className="grid place-items-start justify-center rounded-md bg-background py-6 lg:sticky lg:top-6 lg:self-start">
        <PhonePreview
          username="tucuenta"
          comment={include[0] ? `Quiero el ${include[0]}` : "¡Me encanta!"}
          messages={[opening, link]}
        />
      </div>
    </div>
  )
}

export function OverlaysDemo() {
  const [saving, setSaving] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Abrir modal</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Detener la automatización?</DialogTitle>
            <DialogDescription>
              Va a dejar de responder comentarios nuevos. Las conversaciones que ya empezaron siguen hasta terminar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <DialogClose render={<Button variant="destructive" />}>Detener</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button
        variant="outline"
        loading={saving}
        onClick={() => {
          setSaving(true)
          setTimeout(() => {
            setSaving(false)
            toast.success("Cambios guardados")
          }, 1200)
        }}
      >
        Guardar y avisar
      </Button>
      <Button variant="outline" onClick={() => toast.error("No se pudo enviar: la ventana de 24 h cerró")}>
        Toast de error
      </Button>
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" />}>Pasa el mouse</TooltipTrigger>
        <TooltipContent>Esto también está escrito en otro lado de la pantalla</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function TogglesDemo() {
  const [on, setOn] = useState(true)
  const [checked, setChecked] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-6">
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={on} onCheckedChange={setOn} /> Pedir email
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch disabled /> Deshabilitado
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} /> Seguir la conversación
      </label>
    </div>
  )
}

export function ComposerDemo() {
  return (
    <div className="grid items-start gap-3 md:grid-cols-2">
      <Composer hoursLeft={18} onSend={() => new Promise((r) => setTimeout(r, 800))} />
      <Composer hoursLeft={null} />
    </div>
  )
}
