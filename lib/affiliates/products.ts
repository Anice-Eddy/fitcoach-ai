import type { AffiliateProduct } from '@/types'

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // SUPPLÉMENTS
  { id: 'aff-whey-optimum', name: 'Gold Standard Whey', brand: 'Optimum Nutrition', description: 'Whey protéine de référence — 24g de protéines par dose.', category: 'SUPPLEMENTS', affiliateUrl: '#', price: 59.99, commissionRateMin: 10, commissionRateMax: 15, fitnessGoals: ['MUSCLE_GAIN', 'WEIGHT_LOSS'], tags: ['whey', 'protéine', 'récupération'] },
  { id: 'aff-creatine', name: 'Créatine Monohydrate', brand: 'Myprotein', description: 'Créatine pure pour la force et la puissance musculaire.', category: 'SUPPLEMENTS', affiliateUrl: '#', price: 24.99, commissionRateMin: 12, commissionRateMax: 18, fitnessGoals: ['MUSCLE_GAIN'], tags: ['créatine', 'force', 'puissance'] },
  { id: 'aff-bcaa', name: 'BCAA 2:1:1', brand: 'Scitec', description: 'Acides aminés ramifiés pour la récupération musculaire.', category: 'SUPPLEMENTS', affiliateUrl: '#', price: 29.99, commissionRateMin: 10, commissionRateMax: 15, fitnessGoals: ['MUSCLE_GAIN', 'ENDURANCE'], tags: ['bcaa', 'récupération', 'acides aminés'] },
  { id: 'aff-vitamins', name: 'Multivitamines Sport', brand: 'Nutri & Co', description: 'Complexe vitaminique adapté aux sportifs actifs.', category: 'SUPPLEMENTS', affiliateUrl: '#', price: 34.90, commissionRateMin: 8, commissionRateMax: 12, fitnessGoals: ['GENERAL_FITNESS', 'ENDURANCE'], tags: ['vitamines', 'santé', 'immunité'] },
  { id: 'aff-preworkout', name: 'Pre-Workout Nitro', brand: 'BSN', description: 'Booster d\'entraînement pour l\'énergie et la concentration.', category: 'SUPPLEMENTS', affiliateUrl: '#', price: 39.99, commissionRateMin: 12, commissionRateMax: 20, fitnessGoals: ['MUSCLE_GAIN', 'ENDURANCE'], tags: ['pre-workout', 'énergie', 'pump'] },

  // ÉQUIPEMENT
  { id: 'aff-dumbbells', name: 'Haltères réglables 2×25kg', brand: 'Bowflex', description: 'Haltères ajustables de 2 à 25 kg — parfaits pour la maison.', category: 'EQUIPMENT', affiliateUrl: '#', price: 299, commissionRateMin: 4, commissionRateMax: 7, fitnessGoals: ['MUSCLE_GAIN', 'GENERAL_FITNESS'], tags: ['haltères', 'maison', 'polyvalent'] },
  { id: 'aff-kettlebell', name: 'Kettlebell 16kg', brand: 'Rogue', description: 'Kettlebell en fonte — idéale pour le training fonctionnel.', category: 'EQUIPMENT', affiliateUrl: '#', price: 59, commissionRateMin: 4, commissionRateMax: 6, fitnessGoals: ['GENERAL_FITNESS', 'ENDURANCE', 'WEIGHT_LOSS'], tags: ['kettlebell', 'fonctionnel', 'cardio'] },
  { id: 'aff-mat', name: 'Tapis de yoga Premium', brand: 'Manduka', description: 'Tapis épais et antidérapant — idéal yoga et stretching.', category: 'EQUIPMENT', affiliateUrl: '#', price: 89, commissionRateMin: 5, commissionRateMax: 8, fitnessGoals: ['FLEXIBILITY', 'GENERAL_FITNESS'], tags: ['tapis', 'yoga', 'étirements'] },
  { id: 'aff-resistance-band', name: 'Bandes de résistance (set 5)', brand: 'TheraBand', description: 'Set de 5 bandes élastiques de résistances variées.', category: 'EQUIPMENT', affiliateUrl: '#', price: 29.99, commissionRateMin: 6, commissionRateMax: 10, fitnessGoals: ['FLEXIBILITY', 'GENERAL_FITNESS', 'WEIGHT_LOSS'], tags: ['bandes', 'élastiques', 'mobilité'] },
  { id: 'aff-bench', name: 'Banc de musculation pliable', brand: 'Marcy', description: 'Banc réglable inclinable — compact et stable.', category: 'EQUIPMENT', affiliateUrl: '#', price: 149, commissionRateMin: 4, commissionRateMax: 7, fitnessGoals: ['MUSCLE_GAIN'], tags: ['banc', 'musculation', 'maison'] },

  // VÊTEMENTS
  { id: 'aff-legging', name: 'Legging compression Pro', brand: 'Nike', description: 'Legging de compression haute performance — hommes/femmes.', category: 'CLOTHING', affiliateUrl: '#', price: 69.99, commissionRateMin: 5, commissionRateMax: 10, fitnessGoals: ['ENDURANCE', 'GENERAL_FITNESS'], tags: ['legging', 'compression', 'sport'] },
  { id: 'aff-tshirt', name: 'T-shirt technique DryFit', brand: 'Adidas', description: 'T-shirt respirant à évacuation rapide de l\'humidité.', category: 'CLOTHING', affiliateUrl: '#', price: 34.99, commissionRateMin: 5, commissionRateMax: 8, fitnessGoals: ['GENERAL_FITNESS', 'ENDURANCE'], tags: ['t-shirt', 'respirant', 'confort'] },
  { id: 'aff-shoes', name: 'Chaussures training MetCon', brand: 'Nike', description: 'Chaussures polyvalentes pour la musculation et le CrossFit.', category: 'CLOTHING', affiliateUrl: '#', price: 129.99, commissionRateMin: 6, commissionRateMax: 12, fitnessGoals: ['MUSCLE_GAIN', 'GENERAL_FITNESS'], tags: ['chaussures', 'training', 'crossfit'] },
  { id: 'aff-gloves', name: 'Gants de musculation', brand: 'Harbinger', description: 'Gants avec protection des paumes — grip renforcé.', category: 'CLOTHING', affiliateUrl: '#', price: 24.99, commissionRateMin: 7, commissionRateMax: 12, fitnessGoals: ['MUSCLE_GAIN'], tags: ['gants', 'grip', 'protection'] },
  { id: 'aff-bag', name: 'Sac de sport 40L', brand: 'Under Armour', description: 'Sac spacieux avec compartiment chaussures et poche humide.', category: 'CLOTHING', affiliateUrl: '#', price: 59.99, commissionRateMin: 5, commissionRateMax: 9, fitnessGoals: ['GENERAL_FITNESS'], tags: ['sac', 'sport', 'gym'] },

  // LIVRES
  { id: 'aff-book-nutrition', name: 'Nutrition sportive — Le guide', brand: 'Thierry Souccar', description: 'La référence française pour l\'alimentation du sportif.', category: 'BOOKS', affiliateUrl: '#', price: 22.90, commissionRateMin: 5, commissionRateMax: 8, fitnessGoals: ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS'], tags: ['nutrition', 'guide', 'alimentation'] },
  { id: 'aff-book-muscle', name: 'Musculation — La méthode Delavier', brand: 'Frédéric Delavier', description: 'Atlas illustré de la musculation — guide anatomique de référence.', category: 'BOOKS', affiliateUrl: '#', price: 25.90, commissionRateMin: 5, commissionRateMax: 8, fitnessGoals: ['MUSCLE_GAIN'], tags: ['musculation', 'anatomie', 'technique'] },
  { id: 'aff-book-recipes', name: '100 recettes fit & saveurs', brand: 'Laurent Ournac', description: 'Recettes équilibrées et gourmandes pour atteindre ses objectifs.', category: 'BOOKS', affiliateUrl: '#', price: 19.90, commissionRateMin: 6, commissionRateMax: 10, fitnessGoals: ['WEIGHT_LOSS', 'GENERAL_FITNESS'], tags: ['recettes', 'cuisine', 'healthy'] },
  { id: 'aff-book-endurance', name: 'Born to Run', brand: 'Christopher McDougall', description: 'Le bestseller sur la course à pied et l\'ultra-endurance.', category: 'BOOKS', affiliateUrl: '#', price: 10.20, commissionRateMin: 5, commissionRateMax: 8, fitnessGoals: ['ENDURANCE'], tags: ['course', 'trail', 'endurance'] },
  { id: 'aff-book-mindset', name: "Can't Hurt Me", brand: 'David Goggins', description: "L'histoire de David Goggins et les clés du mental d'acier.", category: 'BOOKS', affiliateUrl: '#', price: 19.50, commissionRateMin: 5, commissionRateMax: 8, fitnessGoals: ['GENERAL_FITNESS', 'ENDURANCE'], tags: ['mindset', 'motivation', 'mental'] },
]

export function getProductsByCategory(category: string) {
  return AFFILIATE_PRODUCTS.filter((p) => p.category === category)
}

export function getProductsByGoal(goal: string) {
  return AFFILIATE_PRODUCTS.filter((p) => p.fitnessGoals.includes(goal as never))
}
