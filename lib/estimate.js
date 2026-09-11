const locations = {
  'сокільники': { label: 'Сокільники', depth: '40–70 м' },
  'винники': { label: 'Винники', depth: '45–80 м' },
  'брюховичі': { label: 'Брюховичі', depth: '35–65 м' },
  'городок': { label: 'Городок', depth: '45–85 м' },
  'дрогобич': { label: 'Дрогобич', depth: '35–75 м' },
};

export function estimateByLocation(value) {
  const normalized = String(value ?? '').trim().toLocaleLowerCase('uk-UA');

  if (!normalized) {
    return {
      label: 'Ваш населений пункт',
      depth: 'вкажіть локацію',
      kind: 'empty',
    };
  }

  const match = locations[normalized];
  if (match) {
    return { ...match, kind: 'known' };
  }

  const label = String(value).trim();
  return {
    label: label.charAt(0).toLocaleUpperCase('uk-UA') + label.slice(1),
    depth: 'потрібна оцінка',
    kind: 'custom',
  };
}

export const popularLocations = Object.values(locations).map((item) => item.label);
