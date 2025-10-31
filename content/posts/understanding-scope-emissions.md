---
title: "Understanding Scope 1, 2, and 3 Emissions in Public Sector Accounting"
date: "2025-01-20"
excerpt: "A comprehensive look at how public sector organizations categorize and measure greenhouse gas emissions across different scopes."
tags: ["GHG accounting", "public sector", "climate policy", "sustainability"]
author: "Harrison Weiss"
---

# Understanding Scope 1, 2, and 3 Emissions in Public Sector Accounting

When public sector organizations commit to reducing their greenhouse gas emissions, one of the first challenges is understanding what to measure. The GHG Protocol provides a framework that categorizes emissions into three "scopes," each representing different sources and levels of organizational control.

## The Three Scopes

### Scope 1: Direct Emissions

Scope 1 emissions are those directly produced by sources owned or controlled by the organization. For a city government, this typically includes:

- Emissions from city-owned vehicles (police cars, fire trucks, sanitation vehicles)
- Natural gas used in city-owned buildings
- Fugitive emissions from refrigerants in HVAC systems
- Any on-site fuel combustion

**Why it matters:** These emissions are under direct organizational control, making them the most straightforward to measure and reduce through operational changes.

### Scope 2: Indirect Emissions from Purchased Energy

Scope 2 covers emissions from the generation of purchased electricity, steam, heating, or cooling consumed by the organization. While the actual combustion happens at a power plant elsewhere, the organization is responsible because it purchases and uses that energy.

For public sector entities, this primarily means:

- Electricity purchased for government buildings
- District steam or chilled water (common in dense urban areas)

**Why it matters:** While these emissions occur off-site, they're a direct result of organizational energy consumption and can be significantly reduced through energy efficiency and renewable energy procurement.

### Scope 3: Other Indirect Emissions

Scope 3 is the broadest and often most challenging category. It includes all other indirect emissions that occur in an organization's value chain, including both upstream and downstream activities.

For government entities, relevant Scope 3 categories might include:

- Employee commuting
- Business travel
- Purchased goods and services
- Waste disposal
- Contracted services
- Construction activities

**Why it matters:** Scope 3 often represents the largest portion of an organization's carbon footprint, but it's also the most difficult to measure and influence.

## The Measurement Challenge

Accurately measuring emissions across all three scopes requires robust data systems and clear methodologies. Here's a simplified calculation framework:

$$
\\text{Total Emissions} = \\sum (\\text{Activity Data} \\times \\text{Emission Factor})
$$

For each emission source, you need:

1. **Activity data** - Quantitative measure of the activity (gallons of fuel, kWh of electricity, etc.)
2. **Emission factor** - The amount of GHG emitted per unit of activity

### Example Calculation

Let's calculate emissions from a city vehicle fleet:

```python
# Scope 1: Fleet emissions calculation

fleet_data = {
    'gasoline_vehicles': {
        'fuel_consumed_gallons': 50000,
        'emission_factor': 0.008887  # metric tons CO2e per gallon
    },
    'diesel_vehicles': {
        'fuel_consumed_gallons': 30000,
        'emission_factor': 0.010180  # metric tons CO2e per gallon
    }
}

def calculate_fleet_emissions(fleet_data):
    total_emissions = 0
    for vehicle_type, data in fleet_data.items():
        emissions = data['fuel_consumed_gallons'] * data['emission_factor']
        print(f"{vehicle_type}: {emissions:.2f} metric tons CO2e")
        total_emissions += emissions
    return total_emissions

total = calculate_fleet_emissions(fleet_data)
print(f"\\nTotal fleet emissions: {total:.2f} metric tons CO2e")
```

Output:
```
gasoline_vehicles: 444.35 metric tons CO2e
diesel_vehicles: 305.40 metric tons CO2e

Total fleet emissions: 749.75 metric tons CO2e
```

## Practical Challenges in Public Sector Accounting

Public sector organizations face unique challenges in GHG accounting:

1. **Data fragmentation** - Information may be spread across multiple departments with different systems
2. **Scope 3 complexity** - Government activities touch countless areas, making comprehensive Scope 3 accounting resource-intensive
3. **Consistency over time** - Maintaining consistent methodologies as operations and data systems evolve
4. **Comparability** - Balancing standardized approaches with the unique characteristics of different jurisdictions

## Moving Forward

Effective GHG accounting is foundational to climate action. While perfect precision is impossible, developing systematic approaches to measurement enables:

- **Baseline establishment** - Understanding current emissions levels
- **Target setting** - Creating informed, achievable reduction goals
- **Progress tracking** - Measuring the effectiveness of interventions
- **Transparency** - Communicating clearly with stakeholders and the public

As we continue to refine these methodologies, the goal remains clear: provide decision-makers with accurate, actionable information to drive meaningful emissions reductions.

---

*This post reflects general principles of GHG accounting. Specific methodologies may vary by jurisdiction and should be tailored to local circumstances and regulatory requirements.*
