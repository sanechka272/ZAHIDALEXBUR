const locations = {
  'сокільники': { label: 'Сокільники' },
  'винники': { label: 'Винники' },
  'брюховичі': { label: 'Брюховичі' },
  'городок': { label: 'Городок' },
  'дрогобич': { label: 'Дрогобич' },
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
    return { ...match, depth: 'потрібна оцінка', kind: 'known' };
  }

  const label = String(value).trim();
  return {
    label: label.charAt(0).toLocaleUpperCase('uk-UA') + label.slice(1),
    depth: 'потрібна оцінка',
    kind: 'custom',
  };
}

export const popularLocations = Object.values(locations).map((item) => item.label);
