import { z } from 'zod'
import {
  ClientService,
  MessageStore,
  PreviewService,
  ResourcesStore,
  SharesStore,
  SpacesStore,
  UserStore
} from '@ownclouders/web-pkg'
import { Router } from 'vue-router'
import { Language } from 'vue3-gettext'
import PQueue from 'p-queue'

export const eventSchema = z.object({
  itemid: z.string(),
  parentitemid: z.string(),
  spaceid: z.string().optional(),
  initiatorid: z.string().optional(),
  etag: z.string().optional(),
  affecteduserids: z.array(z.string()).optional().nullable()
})

export type EventSchemaType = z.infer<typeof eventSchema>

export interface SSEEventOptions {
  resourcesStore: ResourcesStore
  spacesStore: SpacesStore
  userStore: UserStore
  messageStore: MessageStore
  sharesStore: SharesStore
  clientService: ClientService
  previewService: PreviewService
  router: Router
  language: Language
  resourceQueue: PQueue
  sseData: EventSchemaType
}

export interface SseEventWrapperOptions extends Omit<SSEEventOptions, 'sseData'> {
  msg: MessageEvent
  topic: string
  method: (options: SSEEventOptions) => Promise<unknown> | unknown
}
