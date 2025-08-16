const KEY = 'fav_services_v1'
export function getFavIds(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
export function setFavIds(ids){
  localStorage.setItem(KEY, JSON.stringify(Array.from(new Set(ids))))
}
export function toggleFav(id){
  const ids = getFavIds()
  const idx = ids.indexOf(id)
  if (idx >= 0) { ids.splice(idx,1) } else { ids.push(id) }
  setFavIds(ids)
  return ids
}
export function isFav(id){ return getFavIds().includes(id) }
