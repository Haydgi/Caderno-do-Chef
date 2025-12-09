// Lista de categorias de receitas permitidas (frontend)
export const ALLOWED_RECIPE_CATEGORIES = [
  'Aperitivos e Entradas',
  'Sopas e Cremes',
  'Saladas',
  'Massas',
  'Aves',
  'Carnes Vermelhas',
  'Pescados e Frutos do Mar',
  'Vegetarianos e Veganos',
  'Acompanhamentos',
  'Molhos e Caldos Base',
  'Pães e Panificação',
  'Sobremesas',
  'Bebidas e Coquetéis'
];

// Opcional: função para carregar do backend quando quiser evitar duplicação
export async function fetchAllowedCategories(baseUrl) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${baseUrl}/api/receitas/categorias/permitidas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Falha ao carregar categorias permitidas');
    const data = await res.json();
    return Array.isArray(data) && data.length ? data : ALLOWED_RECIPE_CATEGORIES;
  } catch {
    return ALLOWED_RECIPE_CATEGORIES;
  }
}
