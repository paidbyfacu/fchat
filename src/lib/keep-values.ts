import { startTransition, type FormEvent } from "react"

/**
 * Envía un formulario a la acción de useActionState sin que React lo vacíe al
 * terminar. Con `action={...}` React borra los campos después de cada envío, y si
 * la acción devolvió un error la persona tenía que volver a escribir todo.
 */
export function keepValues(action: (form: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter
    const form = new FormData(e.currentTarget, submitter instanceof HTMLElement ? submitter : null)
    startTransition(() => action(form))
  }
}
