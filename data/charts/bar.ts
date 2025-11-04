export const barChartData = [
  {
    title: "Population",
    categoryField: "type",
    colorDomain: ["Rural", "Urban"],
    colorRange: ["#79A1B7", "#195B83"],
    textColor: "white",
    values: [
      { type: "Rural", percentage: 80.1 },
      { type: "Urban", percentage: 19.9 },
    ],
  },
  {
    title: "Poverty",
    categoryField: "type",
    colorDomain: ["In poverty", "Out of poverty"],
    colorRange: ["#EC5A47", "#F4BB21"],
    // textColor: 'black',
    values: [
      { type: "In poverty", percentage: 52.7 },
      { type: "Out of poverty", percentage: 47.3 },
    ],
  },
  {
    title: "Land Use",
    categoryField: "type",
    colorDomain: ["Agriculture", "Forest", "Other"],
    colorRange: ["#74B95A", "#216729", "#4FB5B7"],
    // textColor: 'black',
    values: [
      { type: "Agriculture", percentage: 73.5 },
      { type: "Forest", percentage: 0.3 },
      { type: "Other", percentage: 26.2 },
    ],
  },
];
