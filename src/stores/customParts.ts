import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { componentSchema } from '../domain/schemas'
import type { Part } from '../domain/types'

interface CustomPartsState {
  parts: Part[]
  addPart: (part: Part) => void
  removePart: (id: string) => void
}

export const useCustomParts = create<CustomPartsState>()(
  persist(
    (set) => ({
      parts: [],
      addPart: (part) => set((s) => ({ parts: [...s.parts.filter((p) => p.id !== part.id), part] })),
      removePart: (id) => set((s) => ({ parts: s.parts.filter((p) => p.id !== id) })),
    }),
    {
      name: 'bikeapp.customParts.v1',
      // Drop invalid persisted entries instead of crashing — old app versions or
      // hand-edited storage must never take the app down.
      merge: (persisted, current) => {
        const incoming = (persisted as Partial<CustomPartsState> | undefined)?.parts ?? []
        const valid = incoming.filter((p) => componentSchema.safeParse(p).success)
        return { ...current, parts: valid }
      },
    },
  ),
)
