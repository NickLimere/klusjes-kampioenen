import { createReward } from '../src/lib/db-service.js';

const rewards = [
  {
    title: "Extra Screen Time",
    description: "30 minutes of extra screen time",
    icon: "📺",
    pointCost: 50
  },
  {
    title: "Stay Up Late",
    description: "Stay up 30 minutes past bedtime",
    icon: "🌙",
    pointCost: 75
  },
  {
    title: "Choose Dinner",
    description: "Choose what's for dinner",
    icon: "🍽️",
    pointCost: 100
  },
  {
    title: "Movie Night",
    description: "Choose a movie for family movie night",
    icon: "🎬",
    pointCost: 150
  },
  {
    title: "Ice Cream Treat",
    description: "Get an ice cream treat",
    icon: "🍦",
    pointCost: 30
  },
  {
    title: "Skip a Chore",
    description: "Skip one chore of your choice",
    icon: "⏭️",
    pointCost: 200
  },
  {
    title: "Game Night",
    description: "Choose a game for family game night",
    icon: "🎮",
    pointCost: 120
  },
  {
    title: "Baking Day",
    description: "Bake cookies or cake with a parent",
    icon: "🍪",
    pointCost: 80
  }
];

async function populateRewards() {
  console.log('Creating rewards...');
  
  for (const reward of rewards) {
    try {
      const id = await createReward(reward);
      console.log(`Created reward: ${reward.title} (ID: ${id})`);
    } catch (error) {
      console.error(`Error creating reward ${reward.title}:`, error);
    }
  }
  
  console.log('Finished creating rewards!');
}

populateRewards().catch(console.error); 