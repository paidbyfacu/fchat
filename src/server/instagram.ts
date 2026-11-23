// Client for the Instagram API with Instagram Login.
// The engine receives an InstagramClient: tests use a fake one.

export type IgMessage =
  | { text: string; quick_replies?: { content_type: "text"; title: string; payload: string }[] }
  | {
      attachment: {
        type: "template"
        payload: {
          template_type: "button"
          text: string
          buttons: ({ type: "postback"; title: string; payload: string } | { type: "web_url"; title: string; url: string })[]
        }
      }
    }

export type IgRecipient = { id: string } | { comment_id: string }

export type IgMediaItem = {
  id: string
  caption?: string
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_product_type?: "FEED" | "REELS" | "STORY" | "AD"
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp: string
}

export type IgProfile ={ username?: string; name?: string; is_user_follow_business?: boolean }

export class IgError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
    readonly body?: unknown,
  ) {
    super(message)
  }
  /** 190 = expired or revoked token */
  get tokenInvalid() {
    return this.code === 190
  }
}

export interface InstagramClient {
  sendMessage(token: string, igUserId: string, recipient: IgRecipient, message: IgMessage): Promise<{ message_id: string }>
  replyToComment(token: string, commentId: string, text: string): Promise<{ id: string }>
  getProfile(token: string, igsid: string): Promise<IgProfile>
  getMedia(token: string, mediaId: string): Promise<{ id: string; timestamp: string }>
  listMedia(token: string, igUserId: string, after?: string): Promise<{ data: IgMediaItem[]; after?: string }>
  getMe(token: string): Promise<{ user_id: string; username: string; profile_picture_url?: string }>
  subscribe(token: string, igUserId: string, fields: string[]): Promise<void>
  refreshToken(token: string): Promise<{ access_token: string; expires_in: number }>
}

export function httpInstagram(apiVersion: string, fetchImpl: typeof fetch = fetch): InstagramClient {
  const base = `https://graph.instagram.com/${apiVersion}`

  async function call<T>(token: string, method: "GET" | "POST", path: string, params?: Record<string, string>, body?: unknown): Promise<T> {
    const url = new URL(`${base}/${path}`)
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v)
    const res = await fetchImpl(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    })
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } }
    if (!res.ok || json.error) {
      throw new IgError(json.error?.message ?? `HTTP ${res.status}`, res.status, json.error?.code, json)
    }
    return json as T
  }

  return {
    sendMessage: (token, igUserId, recipient, message) =>
      call(token, "POST", `${igUserId}/messages`, undefined, { recipient, message }),
    replyToComment: (token, commentId, text) => call(token, "POST", `${commentId}/replies`, { message: text }),
    getProfile: (token, igsid) => call(token, "GET", igsid, { fields: "username,name,is_user_follow_business" }),
    getMedia: (token, mediaId) => call(token, "GET", mediaId, { fields: "id,timestamp" }),
    listMedia: async (token, igUserId, after) => {
      const r = await call<{ data: IgMediaItem[]; paging?: { cursors?: { after?: string }; next?: string } }>(token, "GET", `${igUserId}/media`, {
        fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp",
        limit: "24",
        ...(after ? { after } : {}),
      })
      return { data: r.data ?? [], after: r.paging?.next ? r.paging.cursors?.after : undefined }
    },
    getMe: (token) => call(token, "GET", "me", { fields: "user_id,username,profile_picture_url" }),
    subscribe: async (token, igUserId, fields) => {
      await call(token, "POST", `${igUserId}/subscribed_apps`, { subscribed_fields: fields.join(",") })
    },
    refreshToken: async (token) => {
      const url = new URL("https://graph.instagram.com/refresh_access_token")
      url.searchParams.set("grant_type", "ig_refresh_token")
      url.searchParams.set("access_token", token)
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(20_000) })
      const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: { message?: string; code?: number } }
      if (!res.ok || !json.access_token) throw new IgError(json.error?.message ?? "refresh failed", res.status, json.error?.code, json)
      return { access_token: json.access_token, expires_in: json.expires_in ?? 60 * 86400 }
    },
  }
}
