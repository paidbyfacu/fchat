import { startTransition, type FormEvent } from "react"

/**
 * Submits a form to a useActionState action without React clearing it afterwards.
 * With `action={...}` React resets the fields after every submit, and if the action
 * returned an error the person had to type everything again.
 */
export function keepValues(action: (form: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter
    const form = new FormData(e.currentTarget, submitter instanceof HTMLElement ? submitter : null)
    startTransition(() => action(form))
  }
}
