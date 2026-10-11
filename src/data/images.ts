import type { Category } from '../types'

const p = (name: string) => `/images/${name}.jpg`

export const photo = {
  weddingBouquet: p('wedding-bouquet'), tableFlowers: p('table-flowers'), platedDinner: p('plated-dinner'),
  festival: p('festival'), confetti: p('confetti'), rusticTable: p('rustic-table'), bannerHall: p('banquet-hall'),
  buffet: p('buffet'), balloons: p('balloons'), gazebo: p('gazebo'), portraitDress: p('portrait-dress'),
  archFlorals: p('arch-florals'), clubConfetti: p('club-confetti'), djStage: p('dj-stage'), dishes: p('dishes'), grill: p('grill'),
}

export const categoryPhotos: Record<Category, string[]> = {
  Catering: [photo.buffet, photo.platedDinner, photo.dishes, photo.grill],
  Photography: [photo.weddingBouquet, photo.portraitDress, photo.archFlorals, photo.tableFlowers],
  'DJs & Music': [photo.djStage, photo.festival, photo.clubConfetti, photo.confetti],
  'Tents & Seating': [photo.gazebo, photo.bannerHall, photo.rusticTable, photo.archFlorals],
  Decor: [photo.archFlorals, photo.tableFlowers, photo.rusticTable, photo.balloons],
}
