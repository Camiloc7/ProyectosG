export interface Item {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  nota?: string;
}

export const data: Record<string, Item[]> = {
  PIZZAS: [
    {
      id: 1,
      name: 'Margarita',
      quantity: 0,
      price: 12,
      image: 'https://source.unsplash.com/400x400/?pizza,margherita',
    },
    {
      id: 2,
      name: 'Pepperoni',
      quantity: 0,
      price: 15,
      image: 'https://source.unsplash.com/400x400/?pizza,pepperoni',
    },
    {
      id: 3,
      name: 'Hawaiana',
      quantity: 0,
      price: 14,
      image: 'https://source.unsplash.com/400x400/?pizza,hawaiian',
    },
  ],
  CARNES: [
    {
      id: 4,
      name: 'Bife de Chorizo',
      quantity: 0,
      price: 25,
      image: 'https://source.unsplash.com/400x400/?steak',
    },
    {
      id: 5,
      name: 'Costillas',
      quantity: 0,
      price: 30,
      image: 'https://source.unsplash.com/400x400/?ribs,bbq',
    },
    {
      id: 6,
      name: 'Pollo a la Plancha',
      quantity: 0,
      price: 18,
      image: 'https://source.unsplash.com/400x400/?grilled,chicken',
    },
  ],
  VINOS: [
    {
      id: 7,
      name: 'Malbec',
      quantity: 0,
      price: 22,
      image: 'https://source.unsplash.com/400x400/?wine,malbec',
    },
    {
      id: 8,
      name: 'Cabernet Sauvignon',
      quantity: 0,
      price: 24,
      image: 'https://source.unsplash.com/400x400/?wine,cabernet',
    },
    {
      id: 9,
      name: 'Chardonnay',
      quantity: 0,
      price: 20,
      image: 'https://source.unsplash.com/400x400/?wine,chardonnay',
    },
  ],
};
