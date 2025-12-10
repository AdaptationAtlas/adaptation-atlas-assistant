import type { SidebarState } from '../types/sidebar';

export function getSectionCount(
  sectionId: string,
  sidebar: SidebarState,
): number {
  switch (sectionId) {
    case 'geography':
      return sidebar.geography.selected.length;

    case 'hazards': {
      let hazardsCount = 0;
      if (sidebar.hazards.heat.name !== 'None') hazardsCount++;
      if (sidebar.hazards.drought.name !== 'None') hazardsCount++;
      if (sidebar.hazards.flood.name !== 'None') hazardsCount++;
      return hazardsCount;
    }

    case 'exposure': {
      let exposureCount = 0;
      if (sidebar.exposure.crop.name !== 'None') exposureCount++;
      if (sidebar.exposure.livestock.name !== 'None') exposureCount++;
      if (sidebar.exposure.population.name !== 'None') exposureCount++;
      return exposureCount;
    }

    case 'capacity':
      return sidebar.adaptiveCapacity.name !== 'None' ? 1 : 0;

    case 'attachments':
      return 0;

    default:
      return 0;
  }
}
