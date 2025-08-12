export type TPilot = {
  id: number
  profileId: number
  profile: {
    id: number
    firstName: string
    lastName: string
    position?: string
  }
}
