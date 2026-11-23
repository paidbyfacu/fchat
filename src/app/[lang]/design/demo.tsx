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

/** The "comment → DM" wizard in miniature: the editor and the preview share state. */
export function WizardDemo() {
  const [scope, setScope] = useState("specific")
  const [match, setMatch] = useState("words")
  const [include, setInclude] = useState(["link", "info"])
  const [exclude, setExclude] = useState(["price"])
  const [opening, setOpening] = useState<Message>({
    text: "Hi! Thanks for commenting 🙌 Want the link?",
    privateReply: true,
    buttons: [{ id: "b1", type: "postback", title: "Yes, send it" }],
    quickReplies: [],
  })
  const [link, setLink] = useState<Message>({
    text: "Here it is 👇",
    privateReply: false,
    buttons: [{ id: "b2", type: "url", title: "Open link", url: "https://", track: true }],
    quickReplies: [],
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[var(--tk-layout-wizard-panel)_1fr]">
      <div className="grid content-start gap-6">
        <section className="grid gap-3">
          <h3 className="text-lg">When someone comments on</h3>
          <OptionGroup
            label="When someone comments on"
            value={scope}
            onValueChange={setScope}
            options={[
              { value: "specific", label: "A specific post or reel" },
              { value: "any", label: "Any post or reel" },
              { value: "next", label: "The next one I publish", hint: "Only one can wait at a time." },
            ]}
          />
        </section>
        <section className="grid gap-3">
          <h3 className="text-lg">And the comment has</h3>
          <OptionGroup
            label="And the comment has"
            value={match}
            onValueChange={setMatch}
            options={[
              { value: "words", label: "Any of these words" },
              { value: "any", label: "Anything" },
            ]}
          />
          {match === "words" && (
            <>
              <KeywordChips label="Words that trigger it" value={include} onChange={setInclude} />
              <KeywordChips label="Words that stop it" value={exclude} onChange={setExclude} variant="exclude" />
            </>
          )}
        </section>
        <MessageEditor label="First DM" value={opening} onChange={setOpening} isFirst />
        <MessageEditor label="DM with the link" value={link} onChange={setLink} />
      </div>
      <div className="grid place-items-start justify-center rounded-md bg-background py-6 lg:sticky lg:top-6 lg:self-start">
        <PhonePreview
          username="youraccount"
          comment={include[0] ? `I want the ${include[0]}` : "Love it!"}
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
        <DialogTrigger render={<Button variant="outline" />}>Open modal</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop the automation?</DialogTitle>
            <DialogDescription>
              It will stop replying to new comments. Conversations that already started continue until they finish.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button variant="destructive" />}>Stop</DialogClose>
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
            toast.success("Changes saved")
          }, 1200)
        }}
      >
        Save and notify
      </Button>
      <Button variant="outline" onClick={() => toast.error("Could not send: the 24 h window closed")}>
        Error toast
      </Button>
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" />}>Hover me</TooltipTrigger>
        <TooltipContent>This is also written elsewhere on the screen</TooltipContent>
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
        <Switch checked={on} onCheckedChange={setOn} /> Ask for email
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch disabled /> Disabled
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} /> Follow the conversation
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
