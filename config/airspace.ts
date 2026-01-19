// Konfiguráció a légterekhez - könnyen módosítható lista
export interface Airspace {
  id: string;        // Egyedi azonosító (pl: 'balkany')
  name: string;      // Megjelenített név (pl: 'BALKÁNY')
  displayName: string; // Teljes megjelenített név (pl: 'BALKÁNY')
}

export const AIRSPACES: Airspace[] = [
  {
    id: 'balkany',
    name: 'BALKÁNY',
    displayName: 'BALKÁNY',
  },
  {
    id: 'hajduhadhaz',
    name: 'HAJDÚHADHÁZ',
    displayName: 'HAJDÚHADHÁZ',
  },
  {
    id: 'HH-HIGH',
    name: 'HH-HIGH',
    displayName: 'HH-HIGH',
  },
  {
    id: 'TRA23E',
    name: 'TRA23E',
    displayName: 'TRA23E',
  },
  {
    id: 'TRA23D',
    name: 'TRA23D',
    displayName: 'TRA23D',
  },
  // További légterek könnyen hozzáadhatók ide:
  // {
  //   id: 'example',
  //   name: 'EXAMPLE',
  //   displayName: 'EXAMPLE AIRSPACE',
  // },
];

