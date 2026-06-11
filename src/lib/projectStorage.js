const STORAGE_KEY = 'gamebox_projects'

export const projectStorage = {
  getAll: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  save: (project) => {
    const projects = projectStorage.getAll()
    const now = new Date().toISOString()
    const existing = projects.findIndex((p) => p.id === project.id)

    if (existing >= 0) {
      // Merge so fields not included in this save (createdAt, status, ...) survive
      projects[existing] = { ...projects[existing], ...project, updatedAt: now }
    } else {
      projects.unshift({
        ...project,
        id: `project_${Date.now()}`,
        status: project.status || 'draft',
        createdAt: now,
        updatedAt: now,
      })
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    return projects[existing >= 0 ? existing : 0]
  },

  delete: (id) => {
    const projects = projectStorage.getAll().filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  },

  duplicate: (id) => {
    const projects = projectStorage.getAll()
    const original = projects.find((p) => p.id === id)
    if (!original) return null
    const copy = { ...original, id: null, gameTitle: `${original.gameTitle || 'コピー'} のコピー` }
    if (copy.rules) copy.rules = { ...copy.rules, gameTitle: copy.gameTitle }
    return projectStorage.save(copy)
  },
}
