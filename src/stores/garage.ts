import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BikeBuild } from '../domain/types'

interface GarageState {
  builds: BikeBuild[]
  addBuild: (build: BikeBuild) => void
  updateSlots: (id: string, slots: Partial<BikeBuild['slots']>) => void
  renameBuild: (id: string, name: string) => void
  removeBuild: (id: string) => void
}

export const useGarage = create<GarageState>()(
  persist(
    (set) => ({
      builds: [],
      addBuild: (build) => set((s) => ({ builds: [...s.builds.filter((b) => b.id !== build.id), build] })),
      updateSlots: (id, slots) =>
        set((s) => ({
          builds: s.builds.map((b) => (b.id === id ? { ...b, slots: { ...b.slots, ...slots } } : b)),
        })),
      renameBuild: (id, name) =>
        set((s) => ({ builds: s.builds.map((b) => (b.id === id ? { ...b, name } : b)) })),
      removeBuild: (id) => set((s) => ({ builds: s.builds.filter((b) => b.id !== id) })),
    }),
    { name: 'bikeapp.garage.v1' },
  ),
)

export function newBuildId(): string {
  return `bike-${Math.random().toString(36).slice(2, 9)}`
}
