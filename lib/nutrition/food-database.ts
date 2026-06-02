// Base de données alimentaire — macros réels pour 100g (source : CIQUAL / USDA FoodData Central)

export interface FoodDB {
  id:       string
  name:     string
  brand?:   string
  calories: number  // kcal/100g
  proteinG: number
  carbsG:   number
  fatG:     number
  fiberG:   number
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy'
  // Tags pour filtrer selon les restrictions alimentaires
  tags?: ('gluten-free' | 'dairy-free' | 'vegetarian' | 'vegan' | 'nut-free')[]
}

export const FOOD_DATABASE: FoodDB[] = [

  // ── PROTÉINES ANIMALES ────────────────────────────────────────────────────
  { id: 'chicken-breast',    name: 'Blanc de poulet',          calories: 165, proteinG: 31,  carbsG: 0,   fatG: 3.6, fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'chicken-thigh',     name: 'Cuisse de poulet',         calories: 209, proteinG: 26,  carbsG: 0,   fatG: 11,  fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'turkey-breast',     name: 'Escalope de dinde',        calories: 135, proteinG: 29,  carbsG: 0,   fatG: 1.6, fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'beef-steak',        name: 'Bœuf — steak haché 5%',   calories: 136, proteinG: 21,  carbsG: 0,   fatG: 5,   fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'salmon',            name: 'Saumon',                   calories: 208, proteinG: 20,  carbsG: 0,   fatG: 13,  fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'tuna-can',          name: 'Thon en conserve',         calories: 116, proteinG: 26,  carbsG: 0,   fatG: 1,   fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'tuna-fresh',        name: 'Thon frais',               calories: 144, proteinG: 23,  carbsG: 0,   fatG: 5,   fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'sardines',          name: 'Sardines à l\'huile',      calories: 208, proteinG: 25,  carbsG: 0,   fatG: 11,  fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'sardines-water',    name: 'Sardines à l\'eau',        calories: 140, proteinG: 24,  carbsG: 0,   fatG: 4.5, fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'mackerel',          name: 'Maquereau',                calories: 205, proteinG: 19,  carbsG: 0,   fatG: 14,  fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'mackerel-can',      name: 'Maquereau en conserve',    calories: 156, proteinG: 20,  carbsG: 0,   fatG: 8,   fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'shrimp',            name: 'Crevettes',                calories: 99,  proteinG: 18,  carbsG: 0.9, fatG: 1.7, fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'cod',               name: 'Cabillaud',                calories: 82,  proteinG: 18,  carbsG: 0,   fatG: 0.7, fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free'] },
  { id: 'eggs',              name: 'Œufs entiers',             calories: 155, proteinG: 13,  carbsG: 1,   fatG: 11,  fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free','vegetarian'] },
  { id: 'egg-whites',        name: 'Blancs d\'œufs',          calories: 52,  proteinG: 11,  carbsG: 0.7, fatG: 0.2, fiberG: 0,   category: 'protein', tags: ['gluten-free','dairy-free','nut-free','vegetarian'] },
  { id: 'whey',              name: 'Whey protéine',            calories: 380, proteinG: 80,  carbsG: 5,   fatG: 5,   fiberG: 0,   category: 'protein', brand: 'Générique', tags: ['gluten-free','nut-free'] },

  // ── PROTÉINES VÉGÉTALES ───────────────────────────────────────────────────
  { id: 'tofu-firm',         name: 'Tofu ferme',               calories: 144, proteinG: 17,  carbsG: 3,   fatG: 9,   fiberG: 0.3, category: 'protein', tags: ['gluten-free','dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'tempeh',            name: 'Tempeh',                   calories: 195, proteinG: 19,  carbsG: 9,   fatG: 11,  fiberG: 1.8, category: 'protein', tags: ['dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'lentils-cooked',    name: 'Lentilles cuites',         calories: 116, proteinG: 9,   carbsG: 20,  fatG: 0.4, fiberG: 8,   category: 'protein', tags: ['gluten-free','dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'chickpeas-cooked',  name: 'Pois chiches cuits',       calories: 164, proteinG: 9,   carbsG: 27,  fatG: 2.6, fiberG: 7,   category: 'protein', tags: ['gluten-free','dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'black-beans',       name: 'Haricots noirs cuits',     calories: 132, proteinG: 9,   carbsG: 24,  fatG: 0.5, fiberG: 8,   category: 'protein', tags: ['gluten-free','dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'edamame',           name: 'Edamame',                  calories: 121, proteinG: 11,  carbsG: 9,   fatG: 5,   fiberG: 5,   category: 'protein', tags: ['gluten-free','dairy-free','vegan','vegetarian','nut-free'] },

  // ── GLUCIDES ──────────────────────────────────────────────────────────────
  { id: 'rice-white',        name: 'Riz blanc cuit',           calories: 130, proteinG: 2.7, carbsG: 28,  fatG: 0.3, fiberG: 0.4, category: 'carb', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'rice-brown',        name: 'Riz complet cuit',         calories: 111, proteinG: 2.6, carbsG: 23,  fatG: 0.9, fiberG: 1.8, category: 'carb', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'oats',              name: 'Flocons d\'avoine',        calories: 389, proteinG: 17,  carbsG: 66,  fatG: 7,   fiberG: 11,  category: 'carb', tags: ['dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'pasta-cooked',      name: 'Pâtes cuites',             calories: 158, proteinG: 6,   carbsG: 31,  fatG: 0.9, fiberG: 1.8, category: 'carb', tags: ['dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'pasta-whole',       name: 'Pâtes complètes cuites',   calories: 149, proteinG: 5.5, carbsG: 29,  fatG: 0.8, fiberG: 3.5, category: 'carb', tags: ['dairy-free','vegan','vegetarian','nut-free'] },
  { id: 'potato',            name: 'Pomme de terre cuite',     calories: 87,  proteinG: 1.9, carbsG: 20,  fatG: 0.1, fiberG: 1.8, category: 'carb', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'sweet-potato',      name: 'Patate douce cuite',       calories: 86,  proteinG: 1.6, carbsG: 20,  fatG: 0.1, fiberG: 3,   category: 'carb', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'quinoa',            name: 'Quinoa cuit',              calories: 120, proteinG: 4.4, carbsG: 22,  fatG: 1.9, fiberG: 2.8, category: 'carb', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'bulgur',            name: 'Boulgour cuit',            calories: 83,  proteinG: 3.1, carbsG: 18,  fatG: 0.2, fiberG: 4.5, category: 'carb', tags: ['dairy-free','vegan','nut-free'] },
  { id: 'couscous',          name: 'Couscous cuit',            calories: 112, proteinG: 3.8, carbsG: 23,  fatG: 0.2, fiberG: 1.4, category: 'carb', tags: ['dairy-free','vegan','nut-free'] },
  { id: 'bread-whole',       name: 'Pain complet',             calories: 247, proteinG: 13,  carbsG: 41,  fatG: 3.4, fiberG: 7,   category: 'carb', tags: ['dairy-free','vegan','nut-free'] },
  { id: 'bread-white',       name: 'Pain blanc',               calories: 265, proteinG: 9,   carbsG: 49,  fatG: 3.2, fiberG: 2.7, category: 'carb', tags: ['dairy-free','vegan','nut-free'] },
  { id: 'tortilla-wheat',    name: 'Tortilla blé',             calories: 303, proteinG: 8,   carbsG: 50,  fatG: 7,   fiberG: 3,   category: 'carb', tags: ['dairy-free','vegan','nut-free'] },

  // ── LIPIDES / NOIX ────────────────────────────────────────────────────────
  { id: 'olive-oil',         name: 'Huile d\'olive',           calories: 884, proteinG: 0,   carbsG: 0,   fatG: 100, fiberG: 0,   category: 'fat', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'coconut-oil',       name: 'Huile de coco',            calories: 892, proteinG: 0,   carbsG: 0,   fatG: 100, fiberG: 0,   category: 'fat', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'rapeseed-oil',      name: 'Huile de colza',           calories: 884, proteinG: 0,   carbsG: 0,   fatG: 100, fiberG: 0,   category: 'fat', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'almonds',           name: 'Amandes',                  calories: 579, proteinG: 21,  carbsG: 22,  fatG: 50,  fiberG: 12,  category: 'fat', tags: ['gluten-free','dairy-free','vegan','vegetarian'] },
  { id: 'walnuts',           name: 'Noix',                     calories: 654, proteinG: 15,  carbsG: 14,  fatG: 65,  fiberG: 6.7, category: 'fat', tags: ['gluten-free','dairy-free','vegan','vegetarian'] },
  { id: 'cashews',           name: 'Noix de cajou',            calories: 553, proteinG: 18,  carbsG: 30,  fatG: 44,  fiberG: 3.3, category: 'fat', tags: ['gluten-free','dairy-free','vegan','vegetarian'] },
  { id: 'peanut-butter',     name: 'Beurre de cacahuète',      calories: 588, proteinG: 25,  carbsG: 20,  fatG: 50,  fiberG: 6,   category: 'fat', tags: ['gluten-free','dairy-free','vegan','vegetarian'] },
  { id: 'avocado',           name: 'Avocat',                   calories: 160, proteinG: 2,   carbsG: 9,   fatG: 15,  fiberG: 7,   category: 'fat', tags: ['gluten-free','dairy-free','vegan','vegetarian','nut-free'] },

  // ── LÉGUMES ───────────────────────────────────────────────────────────────
  { id: 'broccoli',          name: 'Brocoli cuit',             calories: 35,  proteinG: 2.4, carbsG: 7,   fatG: 0.4, fiberG: 2.6, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'spinach',           name: 'Épinards',                 calories: 23,  proteinG: 2.9, carbsG: 3.6, fatG: 0.4, fiberG: 2.2, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'tomato',            name: 'Tomate',                   calories: 18,  proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'cucumber',          name: 'Concombre',                calories: 15,  proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'carrot',            name: 'Carottes',                 calories: 41,  proteinG: 0.9, carbsG: 10,  fatG: 0.2, fiberG: 2.8, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'bell-pepper-red',   name: 'Poivron rouge',            calories: 31,  proteinG: 1,   carbsG: 6,   fatG: 0.3, fiberG: 2.1, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'zucchini',          name: 'Courgette',                calories: 17,  proteinG: 1.2, carbsG: 3.1, fatG: 0.3, fiberG: 1,   category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'green-beans',       name: 'Haricots verts cuits',     calories: 31,  proteinG: 1.8, carbsG: 7,   fatG: 0.1, fiberG: 3.4, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'asparagus',         name: 'Asperges',                 calories: 20,  proteinG: 2.2, carbsG: 3.9, fatG: 0.1, fiberG: 2.1, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'cauliflower',       name: 'Chou-fleur cuit',          calories: 23,  proteinG: 1.9, carbsG: 4.5, fatG: 0.3, fiberG: 2,   category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'mushrooms',         name: 'Champignons',              calories: 22,  proteinG: 3.1, carbsG: 3.3, fatG: 0.3, fiberG: 1,   category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'onion',             name: 'Oignon',                   calories: 40,  proteinG: 1.1, carbsG: 9,   fatG: 0.1, fiberG: 1.7, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'lettuce',           name: 'Laitue / Salade verte',    calories: 15,  proteinG: 1.4, carbsG: 2.9, fatG: 0.2, fiberG: 1.3, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'kale',              name: 'Chou kale',                calories: 49,  proteinG: 4.3, carbsG: 9,   fatG: 0.9, fiberG: 3.6, category: 'vegetable', tags: ['gluten-free','dairy-free','vegan','nut-free'] },

  // ── FRUITS ────────────────────────────────────────────────────────────────
  { id: 'banana',            name: 'Banane',                   calories: 89,  proteinG: 1.1, carbsG: 23,  fatG: 0.3, fiberG: 2.6, category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'apple',             name: 'Pomme',                    calories: 52,  proteinG: 0.3, carbsG: 14,  fatG: 0.2, fiberG: 2.4, category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'orange',            name: 'Orange',                   calories: 47,  proteinG: 0.9, carbsG: 12,  fatG: 0.1, fiberG: 2.4, category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'strawberry',        name: 'Fraises',                  calories: 32,  proteinG: 0.7, carbsG: 8,   fatG: 0.3, fiberG: 2,   category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'blueberry',         name: 'Myrtilles',                calories: 57,  proteinG: 0.7, carbsG: 14,  fatG: 0.3, fiberG: 2.4, category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'kiwi',              name: 'Kiwi',                     calories: 61,  proteinG: 1.1, carbsG: 15,  fatG: 0.5, fiberG: 3,   category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'mango',             name: 'Mangue',                   calories: 60,  proteinG: 0.8, carbsG: 15,  fatG: 0.4, fiberG: 1.6, category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'pear',              name: 'Poire',                    calories: 57,  proteinG: 0.4, carbsG: 15,  fatG: 0.1, fiberG: 3.1, category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },
  { id: 'grapes',            name: 'Raisins',                  calories: 69,  proteinG: 0.7, carbsG: 18,  fatG: 0.2, fiberG: 0.9, category: 'fruit', tags: ['gluten-free','dairy-free','vegan','nut-free'] },

  // ── PRODUITS LAITIERS ─────────────────────────────────────────────────────
  { id: 'greek-yogurt',      name: 'Yaourt grec (0%)',         calories: 59,  proteinG: 10,  carbsG: 3.6, fatG: 0.4, fiberG: 0,   category: 'dairy', tags: ['gluten-free','vegetarian','nut-free'] },
  { id: 'cottage-cheese',    name: 'Fromage blanc (0%)',       calories: 72,  proteinG: 12,  carbsG: 3.4, fatG: 0.4, fiberG: 0,   category: 'dairy', tags: ['gluten-free','vegetarian','nut-free'] },
  { id: 'milk',              name: 'Lait demi-écrémé',         calories: 46,  proteinG: 3.4, carbsG: 4.7, fatG: 1.5, fiberG: 0,   category: 'dairy', tags: ['gluten-free','vegetarian','nut-free'] },
  { id: 'mozzarella',        name: 'Mozzarella',               calories: 280, proteinG: 28,  carbsG: 3,   fatG: 17,  fiberG: 0,   category: 'dairy', tags: ['gluten-free','vegetarian','nut-free'] },
  { id: 'skyr',              name: 'Skyr',                     calories: 63,  proteinG: 11,  carbsG: 4,   fatG: 0.2, fiberG: 0,   category: 'dairy', tags: ['gluten-free','vegetarian','nut-free'] },
]

/** Calcule les macros d'un aliment pour une quantité donnée en grammes. */
export function calculateFoodMacros(foodId: string, grams: number) {
  const food = FOOD_DATABASE.find((f) => f.id === foodId)
  if (!food) return null
  const factor = grams / 100
  return {
    name:     food.name,
    grams,
    calories: Math.round(food.calories * factor),
    proteinG: Math.round(food.proteinG * factor * 10) / 10,
    carbsG:   Math.round(food.carbsG * factor * 10) / 10,
    fatG:     Math.round(food.fatG * factor * 10) / 10,
    fiberG:   Math.round(food.fiberG * factor * 10) / 10,
  }
}

/** Filtre la base selon les restrictions alimentaires de l'utilisateur. */
export function filterFoodsByRestrictions(restrictions: string[]): FoodDB[] {
  if (!restrictions || restrictions.length === 0) return FOOD_DATABASE
  return FOOD_DATABASE.filter(food => {
    if (!food.tags) return true
    // Exclude foods that conflict with active restrictions
    if (restrictions.includes('VEGAN') && !food.tags.includes('vegan')) return false
    if (restrictions.includes('VEGETARIAN') && !food.tags.includes('vegetarian') && !food.tags.includes('vegan')) return false
    if (restrictions.includes('GLUTEN_FREE') && !food.tags.includes('gluten-free')) return false
    if (restrictions.includes('DAIRY_FREE') && !food.tags.includes('dairy-free')) return false
    if (restrictions.includes('NUT_FREE') && !food.tags.includes('nut-free')) return false
    return true
  })
}
